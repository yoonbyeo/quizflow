import { type ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = 'primary',
  size = 'md',
  loading = false,
  children,
  disabled,
  className = '',
  ...props
}, ref) => {
  const variantClass = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    ghost: 'btn-ghost',
    danger: 'btn-danger',
    success: 'btn-secondary',
  }[variant];

  const sizeClass = { sm: 'btn-sm', md: 'btn-md', lg: 'btn-lg' }[size];

  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={`btn ${variantClass} ${sizeClass} ${className}`}
      {...props}
    >
      {loading && (
        <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin .6s linear infinite' }} />
      )}
      {children}
    </button>
  );
});

Button.displayName = 'Button';
export default Button;
