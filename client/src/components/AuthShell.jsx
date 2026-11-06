import { Brand } from './Brand.jsx';
import { IconDroplet, IconLock, IconSparkle } from './Icons.jsx';

function SampleChart() {
  return (
    <div className="auth-visual" aria-hidden="true">
      <div className="auth-visual__top">
        <div>
          <span className="auth-visual__eyebrow">Today’s rhythm</span>
          <strong>3 of 4 readings</strong>
        </div>
        <span className="auth-visual__badge">
          <IconDroplet size={15} />
          steady
        </span>
      </div>

      <svg viewBox="0 0 420 132" className="auth-chart">
        <defs>
          <linearGradient id="auth-chart-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#E9A083" stopOpacity="0.38" />
            <stop offset="100%" stopColor="#E9A083" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="M0 103 C35 95 48 76 82 81 S142 103 178 79 S233 40 268 58 S330 91 364 64 S398 41 420 46 V132 H0 Z"
          fill="url(#auth-chart-fill)"
        />
        <path
          d="M0 103 C35 95 48 76 82 81 S142 103 178 79 S233 40 268 58 S330 91 364 64 S398 41 420 46"
          fill="none"
          stroke="#F0A182"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
        <circle cx="178" cy="79" r="4" fill="#F7F2E6" />
        <circle cx="268" cy="58" r="4" fill="#F7F2E6" />
        <circle cx="364" cy="64" r="4" fill="#F7F2E6" />
      </svg>

      <div className="auth-slots">
        <div className="auth-slot">
          <span>Morning</span>
          <strong>108</strong>
        </div>
        <div className="auth-slot">
          <span>After breakfast</span>
          <strong>142</strong>
        </div>
        <div className="auth-slot">
          <span>After lunch</span>
          <strong>136</strong>
        </div>
        <div className="auth-slot auth-slot--open">
          <span>After dinner</span>
          <strong>—</strong>
        </div>
      </div>
    </div>
  );
}

export default function AuthShell({ children, footer }) {
  return (
    <main className="auth-shell">
      <section className="auth-story" aria-label="About Sweety">
        <div className="auth-story__decor" aria-hidden="true" />
        <Brand light markSize={44} />

        <div className="auth-story__copy">
          <span className="eyebrow eyebrow--light">
            <IconSparkle size={15} />
            Your daily glucose journal
          </span>
          <h1>
            Small readings.
            <br />
            <em>Clearer patterns.</em>
          </h1>
          <p>
            A gentle place to log the four moments that matter, then see your
            day and month come into focus.
          </p>
        </div>

        <SampleChart />

        <p className="auth-story__privacy">
          <IconLock size={16} />
          Your health data stays private to your account.
        </p>
      </section>

      <section className="auth-panel">
        <div className="auth-panel__mobile-brand">
          <Brand markSize={36} />
        </div>
        <div className="auth-card">{children}</div>
        {footer && <div className="auth-panel__footer">{footer}</div>}
      </section>
    </main>
  );
}
