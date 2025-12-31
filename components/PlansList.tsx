import React from 'react';
import { PLANS, PlanType } from '../lib/plans';

const planOrder: PlanType[] = ['free', 'starter', 'pro', 'advanced', 'enterprise'];

export function PlansList() {
  return (
    <>
      {planOrder.map((key) => {
        const plan = PLANS[key];
        return (
          <div key={key} className="plan-card">
            <h2>{plan.name}</h2>
            <p>{plan.description}</p>
            <ul>
              {plan.features.map((feature, i) => (
                <li key={i}>{feature}</li>
              ))}
            </ul>
            {key === 'enterprise' ? (
              <a
                href="/contact/custom-solutions"
                className="cta-btn bg-blue-600 text-white px-4 py-2 rounded font-bold block text-center mt-4"
              >
                Contact Us
              </a>
            ) : (
              <div className="price">{plan.priceDisplay}</div>
              // ...your subscribe/upgrade button here...
            )}
          </div>
        );
      })}
    </>
  );
}