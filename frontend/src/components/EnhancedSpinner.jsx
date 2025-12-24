function EnhancedSpinner({ size = 'md', color = 'primary' }) {
  const sizes = {
    sm: '32px',
    md: '48px',
    lg: '64px',
    xl: '80px'
  };

  const colors = {
    primary: 'var(--accent-gradient)',
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b'
  };

  return (
    <div className="enhanced-spinner-container" style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: 'var(--space-2xl)'
    }}>
      <div className="enhanced-spinner" style={{
        width: sizes[size],
        height: sizes[size],
        position: 'relative'
      }}>
        {/* Outer ring */}
        <div style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          border: '3px solid transparent',
          borderTopColor: colors[color],
          borderRadius: '50%',
          animation: 'spin 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite'
        }} />
        
        {/* Middle ring */}
        <div style={{
          position: 'absolute',
          width: '85%',
          height: '85%',
          top: '7.5%',
          left: '7.5%',
          border: '3px solid transparent',
          borderBottomColor: colors[color],
          borderRadius: '50%',
          animation: 'spin 1.5s cubic-bezier(0.5, 0, 0.5, 1) infinite reverse'
        }} />
        
        {/* Inner ring */}
        <div style={{
          position: 'absolute',
          width: '70%',
          height: '70%',
          top: '15%',
          left: '15%',
          border: '3px solid transparent',
          borderRightColor: colors[color],
          borderRadius: '50%',
          animation: 'spin 1s cubic-bezier(0.5, 0, 0.5, 1) infinite'
        }} />
        
        {/* Center dot */}
        <div style={{
          position: 'absolute',
          width: '20%',
          height: '20%',
          top: '40%',
          left: '40%',
          background: colors[color],
          borderRadius: '50%',
          animation: 'scalePulse 1.5s ease-in-out infinite'
        }} />
      </div>
    </div>
  );
}

export default EnhancedSpinner;
