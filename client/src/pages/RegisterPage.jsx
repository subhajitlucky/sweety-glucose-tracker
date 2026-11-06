import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthShell from '../components/AuthShell.jsx';
import FormField from '../components/FormField.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { validateRegistration } from '../lib/validation.js';
import { ApiError } from '../api/client.js';
import {
  IconAlert,
  IconArrowRight,
  IconEye,
  IconEyeOff,
} from '../components/Icons.jsx';

const initialForm = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
};

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setServerError('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = validateRegistration(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    setServerError('');

    try {
      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      navigate('/', { replace: true });
    } catch (error) {
      setServerError(
        error instanceof ApiError
          ? error.message
          : 'Could not create your account. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      footer={(
        <p>
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      )}
    >
      <span className="eyebrow">Create your journal</span>
      <h2>Start with one reading.</h2>
      <p className="auth-card__lead">
        A private account for your glucose readings, daily notes and monthly
        patterns.
      </p>

      {serverError && (
        <div className="alert alert--error" role="alert">
          <IconAlert size={18} />
          <span>{serverError}</span>
        </div>
      )}

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <FormField id="name" label="Name" error={errors.name}>
          {({ describedBy, invalid }) => (
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              placeholder="Your name"
              value={form.name}
              onChange={(event) => updateField('name', event.target.value)}
              aria-invalid={invalid}
              aria-describedby={describedBy}
            />
          )}
        </FormField>

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

        <FormField
          id="password"
          label="Password"
          hint="At least 8 characters"
          error={errors.password}
        >
          {({ describedBy, invalid }) => (
            <div className="input-with-action">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Create a password"
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

        <FormField
          id="confirm-password"
          label="Confirm password"
          error={errors.confirmPassword}
        >
          {({ describedBy, invalid }) => (
            <input
              id="confirm-password"
              name="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Repeat your password"
              value={form.confirmPassword}
              onChange={(event) => updateField('confirmPassword', event.target.value)}
              aria-invalid={invalid}
              aria-describedby={describedBy}
            />
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
              Creating account…
            </>
          ) : (
            <>
              Create account
              <IconArrowRight size={18} />
            </>
          )}
        </button>
      </form>

      <p className="auth-note">
        Your password is stored as a secure bcrypt hash — never as plain text.
      </p>
    </AuthShell>
  );
}
