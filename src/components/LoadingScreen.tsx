interface LoadingScreenProps {
  title?: string;
  message?: string;
  progress?: number;
}

export function LoadingScreen({ 
  title = "Finance Buckets", 
  message = "Getting everything ready for you...",
  progress = 75
}: LoadingScreenProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-amber-50 to-green-50">
      <div className="text-center max-w-md mx-auto px-6">
        {/* Animated logo */}
        <div className="w-24 h-24 mx-auto mb-8 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-xl relative">
          <span className="text-white text-3xl animate-pulse">💰</span>
          
          {/* Spinning ring */}
          <div className="absolute inset-0 border-4 border-transparent border-t-green-300 rounded-full animate-spin"></div>
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-green-600 via-green-500 to-emerald-500 bg-clip-text text-transparent mb-4 drop-shadow-sm">{title}</h1>
        <p className="text-xl text-gray-600 mb-8 leading-relaxed font-medium">{message}</p>

        {/* Progress bar */}
        <div className="w-full bg-amber-200 rounded-full h-6 overflow-hidden shadow-inner max-w-sm mx-auto mb-4">
          <div 
            className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full transition-all duration-1000 ease-out shadow-sm"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        {/* Reassuring dots */}
        <div className="flex justify-center gap-2">
          <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse delay-0"></div>
          <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse delay-100"></div>
          <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse delay-200"></div>
        </div>
      </div>
    </div>
  );
}