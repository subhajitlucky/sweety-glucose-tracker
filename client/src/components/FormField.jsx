export default function FormField({
  id,
  label,
  error,
  hint,
  children,
  className = '',
}) {
  const describedBy = [hint ? `${id}-hint` : null, error ? `${id}-error` : null]
    .filter(Boolean)
    .join(' ') || undefined;

  return (
    <div className={`field ${error ? 'field--error' : ''} ${className}`.trim()}>
      <div className="field__heading">
        <label htmlFor={id}>{label}</label>
        {hint && (
          <span className="field__hint" id={`${id}-hint`}>
            {hint}
          </span>
        )}
      </div>
      {children({ describedBy, invalid: Boolean(error) })}
      {error && (
        <p className="field__error" id={`${id}-error`}>
          {error}
        </p>
      )}
    </div>
  );
}
