const LoadingSkeleton = () => {
  return (
    <div className="flex justify-start mb-4 animate-pulse">
      <div className="flex items-start max-w-xs">
        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-green-400 to-green-500 flex items-center justify-center text-white text-lg font-bold shadow-lg">
          ⚕️
        </div>
        <div className="mx-3 p-4 rounded-2xl bg-white/90 shadow-lg backdrop-blur-sm text-gray-800 rounded-bl-md border border-white/30">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingSkeleton;
