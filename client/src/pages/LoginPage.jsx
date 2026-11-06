import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AuthShell from '../components/AuthShell.jsx';
import FormField from '../components/FormField.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { validateLogin } from '../lib/validation.js';
import { ApiError } from '../api/client.js';
import {
  IconAlert,
  IconArrowRight,
  IconEye,
  IconEyeOff,
} from '../components/Icons.jsx';

const DEMO_EMAIL = 'demo@sweety.app';
const DEMO_PASSWORD = 'Demo@1234';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const redirectTo = location.state?.from?.pathname || '/';

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setServerError('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = validateLogin(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    setServerError('');

    try {
      await login({ email: form.email.trim(), password: form.password });
      navigate(redirectTo, { replace: true });
    } catch (error) {
      setServerError(
        error instanceof ApiError ? error.message : 'Could not log in. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  function fillDemoCredentials() {
    setForm({ email: DEMO_EMAIL, password: DEMO_PASSWORD });
    setErrors({});
    setServerError('');
  }

  return (
    <AuthShell
      footer={(
        <p>
          New to Sweety? <Link to="/register">Create an account</Link>
        </p>
      )}
    >
      <span className="eyebrow">Welcome back</span>
      <h2>Your day, in one calm place.</h2>
      <p className="auth-card__lead">
        Log in to add a reading or pick up where you left off.
      </p>

      {serverError && (
        <div className="alert alert--error" role="alert">
          <IconAlert size={18} />
          <span>{serverError}</span>
        </div>
      )}

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <FormField id="email" label="Email address" error={errors.email}>
          {({ describedBy, invalid }) => (
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(event) => updateField('email', event.target.value)}
              aria-invalid={invalid}
              aria-describedby={describedBy}
            />
          )}
        </FormField>

        <FormField id="password" label="Password" error={errors.password}>
          {({ describedBy, invalid }) => (
            <div className="input-with-action">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Enter your password"
                value={form.password}
                onChange={(event) => updateField('password', event.target.value)}
                aria-invalid={invalid}
                aria-describedby={describedBy}
              />
              <button
                type="button"
                className="input-action"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
              </button>
            </div>
          )}
        </FormField>

        <button
          type="submit"
          className="btn btn--primary btn--full auth-submit"
          disabled={submitting}
        >
          {submitting ? (
            <>
              <span className="spinner spinner--small" aria-hidden="true" />
              Logging in…
            </>
          ) : (
            <>
              Log in
              <IconArrowRight size={18} />
            </>
          )}
        </button>
      </form>

      <div className="demo-access">
        <div className="demo-access__copy">
          <span className="demo-access__title">Just exploring?</span>
          <span className="demo-access__credentials">
            {DEMO_EMAIL} · {DEMO_PASSWORD}
          </span>
        </div>
        <button type="button" className="text-button" onClick={fillDemoCredentials}>
          Use demo
        </button>
      </div>
    </AuthShell>
  );
}
