"use client";
import React from 'react';
import { ResponsiveSunburst } from '@nivo/sunburst';

export default function SunburstChart({ data }: { data: any }) {
  return (
    <div style={{ height: 600 }}>
      <ResponsiveSunburst
        data={data}
        margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
        id="name"
        value="value"
        cornerRadius={2}
        borderColor={{ theme: 'background' }}
        colors={{ scheme: 'nivo' }}
        childColor={{ from: 'color', modifiers: [['brighter', 0.1]] }}
        
        // --- UPDATED LABEL SETTINGS ---
        enableArcLabels={true}
        arcLabel="id"
        arcLabelsSkipAngle={10}
        
        // 1. Changed to a darker modifier for better contrast on curved segments
        arcLabelsTextColor={{ from: 'color', modifiers: [['darker', 2]] }}

        // 2. Added Radius Offset: This pushes the labels further out or in 
        // to help them align better with the curve of the arc.
        arcLabelsRadiusOffset={0.5} 

        // 3. The "Curved" effect in Nivo is actually handled by the internal 
        // SVG rotation. Ensure you aren't overriding the transform in your theme.
        // ------------------------------

        animate={true}
        motionConfig="gentle"
        theme={{
          labels: {
            text: {
              fontSize: 10,
              fontWeight: 600,
              // 4. Removed hardcoded 'fill' to let arcLabelsTextColor take over
              // and removed any fixed positioning that forces horizontal alignment.
            },
          },
        }}
      />
    </div>
  );
}