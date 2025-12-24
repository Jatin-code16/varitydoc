function AnimatedGradientBg() {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: -2,
      overflow: 'hidden',
      pointerEvents: 'none'
    }}>
      {/* Animated Gradient Orbs */}
      <div className="gradient-orb gradient-orb-1" style={{
        position: 'absolute',
        width: '600px',
        height: '600px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(6, 182, 212, 0.15) 0%, transparent 70%)',
        top: '-200px',
        left: '-100px',
        animation: 'float 20s ease-in-out infinite',
        filter: 'blur(60px)'
      }} />
      
      <div className="gradient-orb gradient-orb-2" style={{
        position: 'absolute',
        width: '500px',
        height: '500px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(59, 130, 246, 0.12) 0%, transparent 70%)',
        top: '20%',
        right: '-150px',
        animation: 'float 15s ease-in-out infinite reverse',
        animationDelay: '3s',
        filter: 'blur(60px)'
      }} />
      
      <div className="gradient-orb gradient-orb-3" style={{
        position: 'absolute',
        width: '400px',
        height: '400px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%)',
        bottom: '10%',
        left: '30%',
        animation: 'float 18s ease-in-out infinite',
        animationDelay: '5s',
        filter: 'blur(60px)'
      }} />

      {/* Mesh Gradient Overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: `
          radial-gradient(at 10% 20%, rgba(6, 182, 212, 0.08) 0px, transparent 50%),
          radial-gradient(at 90% 80%, rgba(139, 92, 246, 0.06) 0px, transparent 50%),
          radial-gradient(at 50% 50%, rgba(59, 130, 246, 0.04) 0px, transparent 50%)
        `,
        animation: 'meshMove 25s ease-in-out infinite alternate',
        mixBlendMode: 'screen'
      }} />

      {/* Subtle Grid Pattern */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `
          linear-gradient(rgba(6, 182, 212, 0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(6, 182, 212, 0.03) 1px, transparent 1px)
        `,
        backgroundSize: '50px 50px',
        opacity: 0.3
      }} />
    </div>
  );
}

export default AnimatedGradientBg;
