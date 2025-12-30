export default function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 bg-black perspective-[1000px]">
      
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="absolute top-[-20%] left-[-10%] w-full h-full bg-linear-to-br from-blue-900/20 via-black to-black blur-3xl" />

      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-[radial-gradient(ellipse_at_top,rgba(29,78,216,0.15),transparent_70%)]" />
      <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-blue-500/10 blur-[100px] rounded-full" />

      <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-white rounded-full opacity-60 shadow-[0_0_10px_white]" />

      <div className="absolute top-3/4 left-1/3 w-1.5 h-1.5 bg-blue-400 rounded-full opacity-50 shadow-[0_0_15px_rgba(59,130,246,1)]" />

      <div className="absolute top-1/3 right-1/4 w-1 h-1 bg-cyan-300 rounded-full opacity-60 shadow-[0_0_12px_rgba(103,232,249,1)]" />
      
      <div className="absolute bottom-1/3 right-1/3 w-0.5 h-0.5 bg-white opacity-30" />
      <div className="absolute top-[15%] right-[40%] w-0.5 h-0.5 bg-blue-200 opacity-20" />

      <div 
        className="absolute bottom-0 left-[-50%] right-[-50%] h-[60vh] origin-bottom transform-gpu"
        style={{ transform: 'rotateX(60deg) translateY(100px)' }}
      >
        <div 
          className="w-full h-full"
          style={{
            backgroundImage: `linear-gradient(rgba(59,130,246,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.08) 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
            maskImage: 'radial-gradient(ellipse at bottom, black 40%, transparent 80%)'
          }}
        />
      </div>
    </div>
  );
}