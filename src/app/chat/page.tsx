export default function ChatPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Chat with UniqueIIT Research Center Assistant
          </h1>
          <p className="text-slate-600">
            Get instant support for finding your next great read
          </p>
        </div>
        
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <iframe
            src="https://automatic.chat/chats/cmes7kmez003yeep64bbdfq2x"
            width="100%"
            height="600px"
            style={{
              border: 'none',
              borderRadius: '16px'
            }}
            title="UniqueIIT Research Center Assistant"
          />
        </div>
        
        <div className="text-center mt-4">
          <p className="text-sm text-slate-500">
            For emergencies, call 911 or go to your nearest emergency room
          </p>
        </div>
      </div>
    </div>
  );
}
