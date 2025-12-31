import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createOpenAI } from '@ai-sdk/openai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { generateText } from 'ai'
import crypto from 'crypto'

// Decryption function
const ALGORITHM = 'aes-256-gcm'

function decrypt(encryptedText: string): string {
  const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY
  
  if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 64) {
    throw new Error('ENCRYPTION_KEY not configured properly')
  }
  
  if (!encryptedText || encryptedText === '{}' || encryptedText === '') {
    throw new Error('No encrypted API key found')
  }
  
  const parts = encryptedText.split(':')
  
  if (parts.length !== 3) {
    throw new Error(`Invalid encrypted format. Expected 3 parts, got ${parts.length}`)
  }
  
  const [ivHex, tagHex, encrypted] = parts
  
  const key = Buffer.from(ENCRYPTION_KEY, 'hex')
  const iv = Buffer.from(ivHex, 'hex')
  const tag = Buffer.from(tagHex, 'hex')
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(tag)
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  
  return decrypted
}

// Get LLM client based on provider
function getLLMClient(provider: string, apiKey: string) {
  switch (provider) {
    case 'anthropic':
      return createAnthropic({ apiKey })
    case 'google':
      return createGoogleGenerativeAI({ apiKey })
    case 'groq':
      return createOpenAI({ 
        apiKey,
        baseURL: 'https://api.groq.com/openai/v1'
      })
    case 'openai':
    default:
      return createOpenAI({ apiKey })
  }
}

export async function POST(request: NextRequest) {
  console.log('\n=== Analytics AI Request ===')
  
  try {
    const body = await request.json()
    const { message, userId, sessionId } = body
    
    console.log('Request:', { userId, messageLength: message?.length })

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Create Supabase client with service role
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get user's LLM configuration
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('llm_provider, llm_model, llm_api_key_encrypted')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'Failed to fetch user settings' }, { status: 500 })
    }

    if (!user.llm_api_key_encrypted) {
      return NextResponse.json({ 
        error: 'No API key configured. Please add your API key in Settings.' 
      }, { status: 400 })
    }

    // Decrypt the API key
    let apiKey: string
    try {
      apiKey = decrypt(user.llm_api_key_encrypted)
    } catch (decryptError: any) {
      console.error('Decryption error:', decryptError.message)
      return NextResponse.json({ 
        error: 'Failed to decrypt API key. Please re-enter your key in Settings.',
      }, { status: 400 })
    }

    // Get relevant schemas
    const keywords = message.toLowerCase().split(/\s+/).filter((w: string) => w.length > 2)
    const { data: schemas } = await supabase.rpc('get_schemas_by_keywords', { search_keywords: keywords })

    // Build schema context
    let schemaContext = ''
    if (schemas && schemas.length > 0) {
      schemaContext = schemas.map((s: any) => 
        `Table: ${s.table_name}\nDescription: ${s.description}\nColumns: ${JSON.stringify(s.columns)}`
      ).join('\n\n')
    } else {
      schemaContext = `Available tables:
- ga_data: Google Analytics data with columns: id, user_id, date, page_path, device_category, channel_group, country, views, active_users, new_users, sessions, views_per_user, avg_engagement_time, bounce_rate, engagement_rate
- gsc_data: Search Console data with columns: id, user_id, date, query, page, country, device, clicks, impressions, ctr, position`
    }

    // System prompt for SQL generation
    const systemPrompt = `You are an AI analytics assistant. Generate PostgreSQL queries to answer user questions about their website analytics.

AVAILABLE SCHEMA:
${schemaContext}

CRITICAL RULES:
1. ALWAYS include "WHERE user_id = '${userId}'" in every query
2. ONLY use SELECT statements
3. Use valid PostgreSQL syntax
4. For date ranges, use: date >= 'YYYY-MM-DD' AND date <= 'YYYY-MM-DD'
5. Default to last 7 days if no date specified: date >= CURRENT_DATE - INTERVAL '7 days'
6. Always use aggregate functions (SUM, COUNT, AVG) with GROUP BY for summaries
7. Limit results to 50 rows max unless user asks for more
8. Order results meaningfully (usually DESC by the main metric)

RESPONSE FORMAT (JSON only, no markdown):
{
  "sql": "SELECT ... FROM ... WHERE user_id = '${userId}' ...",
  "explanation": "One sentence explaining what this query does",
  "summary_prompt": "Analyze this data and provide: 1) Key insight 2) Notable trend 3) Recommendation",
  "chartType": "bar" | "line" | "pie" | "area" | "table",
  "chartConfig": {
    "xAxis": "column_name",
    "yAxis": "column_name", 
    "title": "Chart Title"
  }
}

If query cannot be answered:
{
  "sql": null,
  "explanation": "Reason why query cannot be fulfilled",
  "error": true
}`

    // Get LLM client
    const provider = user.llm_provider || 'openai'
    const model = user.llm_model || 'gpt-4o'
    const llmClient = getLLMClient(provider, apiKey)

    console.log(`Calling ${provider}/${model}...`)

    // Generate SQL using LLM
    const { text: llmResponse } = await generateText({
      model: llmClient(model),
      system: systemPrompt,
      prompt: message,
    })

    console.log('LLM Response:', llmResponse.substring(0, 300))

    // Parse LLM response
    let parsedResponse: any
    try {
      let jsonStr = llmResponse.trim()
      // Remove markdown code blocks if present
      const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/)
      if (jsonMatch) {
        jsonStr = jsonMatch[1].trim()
      }
      parsedResponse = JSON.parse(jsonStr)
    } catch (parseError) {
      console.error('Failed to parse LLM response:', parseError)
      return NextResponse.json({
        summary: 'I had trouble understanding that request. Please try rephrasing your question.',
        data: null,
        chartType: 'none',
        sql: null,
        error: true,
      })
    }

    // If no SQL generated
    if (!parsedResponse.sql || parsedResponse.error) {
      return NextResponse.json({
        summary: parsedResponse.explanation || 'Unable to generate query for this request.',
        data: null,
        chartType: 'none',
        sql: null,
      })
    }

    // Validate SQL
    const sqlUpper = parsedResponse.sql.toUpperCase().trim()
    if (!sqlUpper.startsWith('SELECT')) {
      return NextResponse.json({
        summary: 'Invalid query: Only SELECT statements are allowed.',
        data: null,
        chartType: 'none',
        sql: null,
        error: true,
      })
    }

    const dangerousKeywords = ['INSERT', 'UPDATE', 'DELETE', 'DROP', 'TRUNCATE', 'ALTER', 'CREATE', 'GRANT', 'REVOKE']
    for (const keyword of dangerousKeywords) {
      if (sqlUpper.includes(keyword)) {
        return NextResponse.json({
          summary: `Invalid query: ${keyword} statements are not allowed.`,
          data: null,
          chartType: 'none',
          sql: null,
          error: true,
        })
      }
    }

    // Execute the query using RPC
    console.log('Executing SQL:', parsedResponse.sql)
    
    const { data: queryResults, error: queryError } = await supabase
      .rpc('execute_readonly_query', { query_text: parsedResponse.sql })

    if (queryError) {
      console.error('Query execution error:', queryError)
      return NextResponse.json({
        summary: `Query error: ${queryError.message}. Please try a different question.`,
        data: null,
        chartType: 'none',
        sql: parsedResponse.sql,
        error: true,
      })
    }

    console.log('Query results:', queryResults?.length || 0, 'rows')

    // Generate summary using LLM
    let dataSummary = parsedResponse.explanation || ''
    
    if (queryResults && queryResults.length > 0) {
      try {
        const summaryPrompt = `Analyze this data and provide a brief insight (2-3 sentences max):

Data (${queryResults.length} rows):
${JSON.stringify(queryResults.slice(0, 20), null, 2)}

Question asked: "${message}"

Provide:
1. Key finding from the data
2. One actionable insight or recommendation

Keep it concise and actionable.`

        const { text: summaryResponse } = await generateText({
          model: llmClient(model),
          prompt: summaryPrompt,
        })

        dataSummary = summaryResponse
      } catch (summaryError) {
        console.error('Summary generation error:', summaryError)
        dataSummary = parsedResponse.explanation || `Found ${queryResults.length} results.`
      }
    }

    // Save conversation
    try {
      const convSessionId = sessionId || crypto.randomUUID()
      await supabase.from('ai_conversations').insert([
        {
          user_id: userId,
          session_id: convSessionId,
          role: 'user',
          content: message,
        },
        {
          user_id: userId,
          session_id: convSessionId,
          role: 'assistant',
          content: dataSummary,
          sql_generated: parsedResponse.sql,
          chart_type: parsedResponse.chartType,
          model_used: model,
          provider: provider,
        }
      ])
    } catch (convError) {
      console.error('Failed to save conversation:', convError)
    }

    console.log('✓ Request completed successfully')

    return NextResponse.json({
      summary: dataSummary,
      data: queryResults || [],
      chartType: parsedResponse.chartType || 'table',
      chartConfig: parsedResponse.chartConfig || {},
      sql: parsedResponse.sql,
      rowCount: queryResults?.length || 0,
    })

  } catch (error: any) {
    console.error('Analytics AI error:', error)
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
