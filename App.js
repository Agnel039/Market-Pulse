import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';

// --- SVG Icons ---
const SearchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
);

const NewsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2V4a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2Z" />
        <path d="M16 2v20" /><path d="M8 2v20" /><path d="M12 2v20" />
    </svg>
);

// --- Helper Components ---

const Spinner = () => (
    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const PulseVisualizer = ({ pulse }) => {
    const getPulseStyles = () => {
        if (!pulse) return { color: 'text-gray-400', bg: 'bg-gray-500', shadow: 'shadow-neutral' };
        switch (pulse.pulse) {
            case 'Bullish': return { color: 'text-green-300', bg: 'bg-green-500', shadow: 'shadow-green' };
            case 'Bearish': return { color: 'text-red-300', bg: 'bg-red-500', shadow: 'shadow-red' };
            default: return { color: 'text-gray-300', bg: 'bg-gray-500', shadow: 'shadow-neutral' };
        }
    };
    const styles = getPulseStyles();
    return (
        <div className="flex flex-col items-center justify-center p-6">
            <div className={`relative w-48 h-48 flex items-center justify-center rounded-full ${styles.shadow}`}>
                <div className={`absolute w-full h-full rounded-full ${styles.bg} opacity-20 animate-pulse-orb`}></div>
                <div className={`absolute w-3/4 h-3/4 rounded-full ${styles.bg} opacity-30 animate-pulse-orb animation-delay-300`}></div>
                <div className="z-10 text-center">
                    <p className={`text-5xl font-extrabold ${styles.color}`}>{pulse ? pulse.pulse : '...'}</p>
                    <p className="text-xl font-bold">{pulse ? pulse.ticker : ''}</p>
                </div>
            </div>
        </div>
    );
};

const MomentumDisplay = ({ history }) => {
    if (!history || history.length < 6) return null;

    const returns = Array.from({ length: 5 }, (_, i) => {
        const today = history[i];
        const yesterday = history[i + 1];
        const change = ((today.close - yesterday.close) / yesterday.close) * 100;
        return { date: today.date, change: change };
    }).reverse();

    const score = returns.reduce((acc, r) => acc + Math.sign(r.change), 0);
    let momentumText, momentumColor;

    if (score >= 3) { momentumText = "Strong Positive"; momentumColor = "text-green-400"; }
    else if (score > 0) { momentumText = "Positive"; momentumColor = "text-green-500"; }
    else if (score === 0) { momentumText = "Neutral"; momentumColor = "text-gray-400"; }
    else { momentumText = "Negative"; momentumColor = "text-red-500"; }

    return (
        <div className="glass-card p-4">
            <h3 className="card-title">5-Day Momentum</h3>
            <div className="flex justify-between items-center mb-4">
                <span className="text-gray-300">Score:</span>
                <span className={`font-bold text-lg ${momentumColor}`}>{momentumText}</span>
            </div>
            <div className="flex justify-between items-center gap-2">
                {returns.map((r, i) => (
                    <div key={i} className={`h-10 w-full rounded ${r.change >= 0 ? 'bg-green-500' : 'bg-red-500'}`} style={{ opacity: 0.4 + Math.abs(r.change) / 4 }}></div>
                ))}
            </div>
        </div>
    );
};

const NewsFeed = ({ news }) => {
    if (!news || news.length === 0) return null;
    return (
        <div className="glass-card p-4">
            <h3 className="card-title flex items-center gap-2"><NewsIcon /> Latest Headlines</h3>
            <div className="space-y-3">
                {news.map((item, index) => (
                    <a href={item.url} key={index} target="_blank" rel="noopener noreferrer" className="block p-3 bg-black/20 rounded-lg hover:bg-black/40 transition-colors duration-300">
                        <p className="font-semibold text-purple-300 mb-1 text-sm">{item.title}</p>
                        <p className="text-xs text-gray-400 leading-relaxed">{item.text.substring(0, 80)}...</p>
                    </a>
                ))}
            </div>
        </div>
    );
};

// --- Main App Component ---
const App = () => {
    const [ticker, setTicker] = useState('');
    const [pulse, setPulse] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [recentSearches, setRecentSearches] = useState([]);
    
    useEffect(() => {
        const storedSearches = localStorage.getItem('marketPulseSearches');
        if (storedSearches) setRecentSearches(JSON.parse(storedSearches));
    }, []);

    const updateRecentSearches = (newTicker) => {
        const updatedSearches = [newTicker, ...recentSearches.filter(t => t !== newTicker)].slice(0, 5);
        setRecentSearches(updatedSearches);
        localStorage.setItem('marketPulseSearches', JSON.stringify(updatedSearches));
    };

    const getMarketPulse = async (searchTicker) => {
        if (!searchTicker) {
            setError('Please enter a stock ticker.');
            return;
        }
        setLoading(true);
        setError('');
        setPulse(null);

        try {
            const response = await fetch(`http://localhost:3001/market-pulse/${searchTicker}`);
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Failed to fetch data from the server.');
            }
            const data = await response.json();
            setPulse(data);
            updateRecentSearches(searchTicker);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };
    
    const handleSearch = () => getMarketPulse(ticker);
    const handleRecentSearchClick = (searchTicker) => {
        setTicker(searchTicker);
        getMarketPulse(searchTicker);
    };

    const chartData = pulse?.history?.map(day => ({
        date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        price: day.close.toFixed(2),
        change: day.change
    })).reverse();

    return (
        <div className="bg-gray-900 text-white min-h-screen font-sans flex items-center justify-center p-4 transition-all duration-500" id="app-bg">
             <div className="background-gradient"></div>
            <div className="w-full max-w-2xl bg-gray-800/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6">
                
                <div className="text-center">
                    <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
                        Market Pulse
                    </h1>
                    <p className="text-gray-300 mt-2">AI-driven market sentiment analysis</p>
                </div>

                <div className="relative">
                    <input
                        type="text"
                        value={ticker}
                        onChange={(e) => setTicker(e.target.value.toUpperCase())}
                        placeholder="Enter Stock Ticker (e.g., AAPL)"
                        className="w-full bg-black/20 text-white placeholder-gray-400 rounded-lg pl-12 pr-28 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 transition duration-300 border border-white/10"
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                        <SearchIcon />
                    </div>
                    <button
                        onClick={handleSearch}
                        disabled={loading}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white font-bold rounded-md px-4 py-1.5 transition-all duration-300 transform hover:scale-105 disabled:scale-100 flex items-center justify-center"
                    >
                        {loading ? <Spinner /> : 'Analyze'}
                    </button>
                </div>
                
                {recentSearches.length > 0 && (
                    <div className="flex flex-wrap gap-2 justify-center items-center">
                        {recentSearches.map(t => (
                            <button key={t} onClick={() => handleRecentSearchClick(t)} className="bg-black/20 hover:bg-black/40 text-xs text-purple-300 rounded-full px-3 py-1 transition-colors border border-white/10">
                                {t}
                            </button>
                        ))}
                    </div>
                )}

                {error && <div className="glass-card text-red-300 px-4 py-3 text-center animate-fade-in">{error}</div>}

                {pulse && (
                    <div className="space-y-6 animate-fade-in">
                        <PulseVisualizer pulse={pulse} />
                        
                        <div className="glass-card p-4">
                            <h3 className="card-title">AI Reasoning:</h3>
                            <p className="text-gray-300 text-center text-lg italic">"{pulse.reason}"</p>
                        </div>
                        
                        <MomentumDisplay history={pulse.history} />

                        {chartData && chartData.length > 0 && (
                             <div className="glass-card p-4">
                                <h3 className="card-title">Recent Price Action</h3>
                                <ResponsiveContainer width="100%" height={200}>
                                    <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                                        <XAxis dataKey="date" stroke="#A0AEC0" fontSize={12} />
                                        <YAxis stroke="#A0AEC0" fontSize={12} domain={['dataMin - 10', 'dataMax + 10']} />
                                        <Tooltip contentStyle={{ backgroundColor: 'rgba(20, 20, 30, 0.8)', backdropFilter: 'blur(5px)', border: '1px solid rgba(255, 255, 255, 0.1)' }} cursor={{fill: 'rgba(148, 163, 184, 0.1)'}}/>
                                        <Bar dataKey="price">
                                            {chartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.change >= 0 ? '#4ADE80' : '#F87171'} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                        
                        <NewsFeed news={pulse.news} />
                    </div>
                )}
            </div>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800&display=swap');
                body { font-family: 'Inter', sans-serif; }
                .background-gradient { position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: -1; background: radial-gradient(circle at 10% 20%, rgb(8, 2, 43) 0%, rgb(2, 8, 38) 47.9%, rgb(0, 0, 0) 90%); }
                
                .glass-card { background: rgba(255, 255, 255, 0.05); border-radius: 0.75rem; border: 1px solid rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px); }
                .card-title { font-size: 1.125rem; font-weight: bold; margin-bottom: 0.75rem; color: #c4b5fd; }

                .animate-fade-in { animation: fadeIn 0.7s ease-in-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
                
                .animate-pulse-orb { animation: pulse-orb-anim 4s ease-in-out infinite; }
                @keyframes pulse-orb-anim { 0%, 100% { transform: scale(1); opacity: 0.2; } 50% { transform: scale(1.05); opacity: 0.3; } }
                .animation-delay-300 { animation-delay: 0.3s; }

                .shadow-green { box-shadow: 0 0 40px 10px rgba(74, 222, 128, 0.3); }
                .shadow-red { box-shadow: 0 0 40px 10px rgba(248, 113, 113, 0.3); }
                .shadow-neutral { box-shadow: 0 0 40px 10px rgba(156, 163, 175, 0.15); }
            `}</style>
        </div>
    );
};

export default App;
