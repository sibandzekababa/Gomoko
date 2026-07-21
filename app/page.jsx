"use client";
import { useState, useEffect } from "react";
import Script from "next/script";

export default function Home() {
  // --- NAVIGATION & VIEWS ---
  // Active views: "DASHBOARD", "GAME_LOBBY", "ACTIVE_GAME", "LEADERBOARD"
  const [currentView, setCurrentView] = useState("DASHBOARD");
  const [gameMode, setGameMode] = useState("ROBOT"); // "ROBOT" or "FRIEND"
  const [username, setUsername] = useState("GuestPlayer");
  const [inputName, setInputName] = useState("");

  // --- SCORE SHEETS & RECORD HISTORY STATS ---
  const [playerScoreCard, setPlayerScoreCard] = useState({ wins: 12, losses: 9, draws: 2, elo: 1201 });
  const [leaderboardData, setLeaderboardData] = useState([
    { rank: 1, name: "kto", country: "🇵🇱", score: 1645 },
    { rank: 2, name: "AIC", country: "🇮🇹", score: 1540 },
    { rank: 3, name: "A1B2", country: "🇸🇬", score: 1495 },
    { rank: 4, name: "khue1980s", country: "🇻🇳", score: 1480 },
    { rank: 5, name: "PlayerCzo", country: "🇭🇺", score: 1201 },
  ]);

  // --- GAMEPLAY STATES ---
  const [board, setBoard] = useState(Array(15).fill(null).map(() => Array(15).fill(null)));
  const [isCzoTurn, setIsCzoTurn] = useState(true);
  const [winner, setWinner] = useState(null);
  const [machineStartsNext, setMachineStartsNext] = useState(false);

  // Victory Confetti Effect Burst Loop
  useEffect(() => {
    if (winner && winner !== "Draw" && typeof window !== "undefined" && window.confetti) {
      const duration = 2.5 * 1000;
      const end = Date.now() + duration;

      const frame = () => {
        window.confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.8 },
          ticks: 200,
          gravity: 1.2,
          scalar: 1.2,
          drift: 0.5,
          colors: ['#ff0055', '#00ffcc', '#ffcc00', '#22ff00', '#9900ff']
        });
        
        window.confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.8 },
          ticks: 200,
          gravity: 1.2,
          scalar: 1.2,
          drift: -0.5,
          colors: ['#ff0055', '#00ffcc', '#ffcc00', '#22ff00', '#9900ff']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    }
  }, [winner]);

  // Automated Machine Turn trigger delay controller
  useEffect(() => {
    if (currentView === "ACTIVE_GAME" && !isCzoTurn && !winner && gameMode === "ROBOT") {
      const aiDelay = setTimeout(() => {
        makeMachineMove();
      }, 700);
      return () => clearTimeout(aiDelay);
    }
  }, [isCzoTurn, winner, currentView, gameMode]);

  const handleSelectMode = (mode) => {
    setGameMode(mode);
    setCurrentView("GAME_LOBBY");
  };

  const handleStartGame = (e) => {
    e.preventDefault();
    if (!inputName.trim()) return;
    setUsername(inputName.trim());
    
    setBoard(Array(15).fill(null).map(() => Array(15).fill(null)));
    setWinner(null);
    setIsCzoTurn(true);
    setMachineStartsNext(true);
    setCurrentView("ACTIVE_GAME");
  };

  // Gomoku 5-in-a-row alignment structural check logic (COORDINATE SLOT FIX)
  const checkWin = (grid, r, c, player) => {
    const directions = [
      [[0, 1], [0, -1]],    // Horizontal (Right, Left)
      [[1, 0], [-1, 0]],    // Vertical (Down, Up)
      [[1, 1], [-1, -1]],   // Diagonal Down-Right, Up-Left
      [[1, -1], [-1, 1]]    // Diagonal Down-Left, Up-Right
    ];
    for (let i = 0; i < directions.length; i++) {
      let count = 1;
      for (let j = 0; j < 2; j++) {
        const [dr, dc] = directions[i][j];
        let row = r + dr;
        let col = c + dc;
        while (row >= 0 && row < 15 && col >= 0 && col < 15 && grid[row][col] === player) {
          count++;
          row += dr;
          col += dc;
        }
      }
      if (count >= 5) return true;
    }
    return false;
  };

  // Fixed Machine Intelligence Counter Defense Scanner
  const makeMachineMove = () => {
    let bestMove = null;
    let fallbackMove = null;

    for (let r = 0; r < 15; r++) {
      for (let c = 0; c < 15; c++) {
        if (board[r][c] === null) {
          if (!fallbackMove) fallbackMove = { r, c };

          // Strategy 1: Check if machine can score an instant win right now
          const testBoardAI = board.map((row) => [...row]);
          testBoardAI[r][c] = "white";
          if (checkWin(testBoardAI, r, c, "white")) {
            executeMove(r, c, "white");
            return;
          }

          // Strategy 2: Scan for active player threats on board and issue blocks
          const testBoardPlayer = board.map((row) => [...row]);
          testBoardPlayer[r][c] = "black";
          if (checkWin(testBoardPlayer, r, c, "black")) {
            bestMove = { r, c };
          }
        }
      }
    }

    const finalMove = bestMove || fallbackMove;
    if (finalMove) {
      executeMove(finalMove.r, finalMove.c, "white");
    }
  };

  const executeMove = (r, c, player) => {
    const newBoard = board.map((row) => [...row]);
    newBoard[r][c] = player;
    setBoard(newBoard);

    if (checkWin(newBoard, r, c, player)) {
      const actualWinner = player === "black" ? username : (gameMode === "ROBOT" ? "Robot" : "Friend");
      setWinner(actualWinner);
      updateScoreSheets(player === "black");
      return;
    }

    if (newBoard.every((row) => row.every((cell) => cell !== null))) {
      setWinner("Draw");
      setPlayerScoreCard(prev => ({ ...prev, draws: prev.draws + 1 }));
      return;
    }

    setIsCzoTurn(player === "white");
  };

  const handleCellClick = (rowIndex, colIndex) => {
    if (board[rowIndex][colIndex] || winner) return;
    if (gameMode === "ROBOT" && !isCzoTurn) return;
    
    const tokenColor = isCzoTurn ? "black" : "white";
    executeMove(rowIndex, colIndex, tokenColor);
  };

  const updateScoreSheets = (isPlayerWin) => {
    if (isPlayerWin) {
      setPlayerScoreCard(prev => ({ ...prev, wins: prev.wins + 1, elo: prev.elo + 22 }));
    } else {
      setPlayerScoreCard(prev => ({ ...prev, losses: prev.losses + 1, elo: Math.max(1000, prev.elo - 18) }));
    }
  };

  const handleResetMatchState = () => {
    setBoard(Array(15).fill(null).map(() => Array(15).fill(null)));
    setWinner(null);
    
    setIsCzoTurn(!machineStartsNext);
    setMachineStartsNext(!machineStartsNext);
  };

  const isStarPoint = (r, c) => {
    return (r === 3 || r === 7 || r === 11) && (c === 3 || c === 7 || c === 11);
  };

  return (
    <main className="grid grid-cols-1 md:grid-cols-[240px_1fr] min-h-screen bg-[#eddcc4] text-[#4a3622] font-sans select-none" style={{ backgroundImage: "linear-gradient(to right, rgba(0,0,0,0.03) 1px, transparent 1px)", backgroundSize: "120px 100%" }}>
      <Script src="https://jsdelivr.net" strategy="afterInteractive" />

      {/* SIDEBAR NAVIGATION PANEL */}
      <aside className="bg-[#dfcbaf] border-r border-[#d4be9f] flex flex-col justify-between p-4 hidden md:flex shadow-inner">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-3 px-2 py-1 border-b border-[#c8b191] pb-4">
            <div className="w-8 h-8 bg-[#b59570] shadow rounded-lg flex items-center justify-center font-black text-white">🎴</div>
            <div>
              <h1 className="text-sm font-black tracking-wider uppercase text-[#5a422b]">Gomoku Hub</h1>
              <p className="text-[10px] text-[#8c7156]">Traditional Board</p>
            </div>
          </div>

          <nav className="flex flex-col gap-1 text-xs font-bold text-[#6d5238]">
            <button onClick={() => setCurrentView("DASHBOARD")} className={`w-full text-left py-2.5 px-3 rounded-lg transition-colors flex items-center gap-2.5 ${currentView === 'DASHBOARD' ? 'bg-[#ebd4b7] text-[#4a3622] shadow-sm font-extrabold' : 'hover:bg-[#ebd4b7]/50'}`}>🏠 Home Dashboard</button>
            <button onClick={() => setCurrentView("LEADERBOARD")} className={`w-full text-left py-2.5 px-3 rounded-lg transition-colors flex items-center gap-2.5 ${currentView === 'LEADERBOARD' ? 'bg-[#ebd4b7] text-[#4a3622] shadow-sm font-extrabold' : 'hover:bg-[#ebd4b7]/50'}`}>📊 Global Leaderboard</button>
            <div className="h-[1px] bg-[#c8b191] my-2" />
            <p className="text-[10px] font-black text-[#8c7156] uppercase tracking-widest px-3 mb-1">Play Modes</p>
            <button onClick={() => handleSelectMode("ROBOT")} className="w-full text-left py-2.5 px-3 rounded-lg hover:bg-[#ebd4b7]/50 flex items-center gap-2">🤖 Play vs Robot</button>
            <button onClick={() => handleSelectMode("FRIEND")} className="w-full text-left py-2.5 px-3 rounded-lg hover:bg-[#ebd4b7]/50 flex items-center gap-2">👥 Play with a Friend</button>
          </nav>
        </div>

        <div className="bg-[#e4d0b5] p-3 rounded-xl border border-[#c8b191] shadow-sm">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-[#4a3622] truncate max-w-[120px]">{username}</span>
            <span className="text-[10px] bg-[#b59570] text-white font-mono font-bold px-1.5 py-0.5 rounded shadow-sm">⚡ {playerScoreCard.elo}</span>
          </div>
          <div className="grid grid-cols-3 gap-1 text-center font-mono text-[9px] text-[#6d5238]">
            <div className="bg-[#dfcbaf] p-1 rounded font-bold"><p className="text-emerald-700">{playerScoreCard.wins}</p>W</div>
            <div className="bg-[#dfcbaf] p-1 rounded font-bold"><p className="text-rose-700">{playerScoreCard.losses}</p>L</div>
            <div className="bg-[#dfcbaf] p-1 rounded font-bold"><p className="text-gray-600">{playerScoreCard.draws}</p>D</div>
          </div>
        </div>
      </aside>
           {/* CORE DISPLAY WINDOW VIEWPORT */}
      <section className="bg-transparent flex flex-col min-h-screen relative p-4 md:p-6 overflow-y-auto">
        
        {/* MOBILE TOP NAVIGATION DISPATCH HEADER */}
        <div className="flex md:hidden items-center justify-between bg-[#dfcbaf] p-3 rounded-xl border border-[#d4be9f] mb-4 shadow-sm">
          <span onClick={() => setCurrentView("DASHBOARD")} className="font-black text-sm text-[#4a3622] cursor-pointer">🎴 Gomoku</span>
          <div className="flex gap-3 text-xs font-bold text-[#6d5238]">
            <button onClick={() => setCurrentView("DASHBOARD")} className="active:text-[#4a3622]">Home</button>
            <button onClick={() => setCurrentView("LEADERBOARD")} className="active:text-[#4a3622]">Scores</button>
          </div>
        </div>

        {/* VIEW 1: GLOBAL DASHBOARD MAIN VIEW */}
        {currentView === "DASHBOARD" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 my-auto max-w-5xl w-full mx-auto">
            <div className="lg:col-span-7 flex flex-col gap-4 justify-center">
              <div className="mb-2">
                <h2 className="text-2xl font-black text-[#4a3622] tracking-tight">Gomoku Arena Online</h2>
                <p className="text-[#6d5238] text-xs">First player to complete a straight line row of 5 marks wins.</p>
              </div>

              <div className="flex flex-col gap-3">
                <button onClick={() => handleSelectMode("FRIEND")} className="w-full bg-[#dfcbaf] hover:bg-[#ebd4b7] border border-[#c8b191] p-4 rounded-xl text-left transition-all duration-200 group flex items-center justify-between shadow-sm">
                  <div>
                    <h3 className="font-bold text-sm text-[#4a3622] group-hover:text-[#5a422b] transition-colors">👥 Play with a friend</h3>
                    <p className="text-[#6d5238] text-[11px] mt-0.5">Invite a companion locally or pass-and-play matching turns.</p>
                  </div>
                  <span className="bg-[#e4d0b5] p-2 rounded-lg text-xs border border-[#c8b191]">→</span>
                </button>

                <button onClick={() => handleSelectMode("ROBOT")} className="w-full bg-[#dfcbaf] hover:bg-[#ebd4b7] border border-[#c8b191] p-4 rounded-xl text-left transition-all duration-200 group flex items-center justify-between shadow-sm">
                  <div>
                    <h3 className="font-bold text-sm text-[#4a3622] group-hover:text-[#5a422b] transition-colors">🤖 Play vs Robot</h3>
                    <p className="text-[#6d5238] text-[11px] mt-0.5">Deploy vs the automated deep matrix intelligence system.</p>
                  </div>
                  <span className="bg-[#e4d0b5] p-2 rounded-lg text-xs border border-[#c8b191]">→</span>
                </button>
              </div>
            </div>

            <div className="lg:col-span-5 flex flex-col gap-4">
              <div className="bg-[#dfcbaf] border border-[#c8b191] p-5 rounded-2xl shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-[#c8b191] pb-3 mb-4">
                    <h4 className="text-xs font-black uppercase tracking-wider text-[#6d5238]">Your Progress Sheet</h4>
                    <span className="text-[11px] font-bold text-white bg-[#b59570] px-2 py-0.5 rounded-full shadow-sm">Level 6</span>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-[11px] mb-1 font-bold text-[#6d5238]">
                        <span>ELO Rating System</span>
                        <span className="text-[#4a3622] font-mono">{playerScoreCard.elo} PTS</span>
                      </div>
                      <div className="w-full bg-[#e4d0b5] h-2 rounded-full overflow-hidden border border-[#c8b191]">
                        <div className="bg-gradient-to-r from-[#b59570] to-[#9c7d59] h-full rounded-full" style={{ width: `${(playerScoreCard.elo / 2000) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-6 text-center font-mono text-xs">
                  <div className="bg-[#e4d0b5] p-2.5 rounded-xl border border-[#c8b191]"><p className="text-emerald-800 font-black text-sm">{playerScoreCard.wins}</p><span className="text-[10px] text-[#6d5238]">Wins</span></div>
                  <div className="bg-[#e4d0b5] p-2.5 rounded-xl border border-[#c8b191]"><p className="text-rose-800 font-black text-sm">{playerScoreCard.losses}</p><span className="text-[10px] text-[#6d5238]">Losses</span></div>
                  <div className="bg-[#e4d0b5] p-2.5 rounded-xl border border-[#c8b191]"><p className="text-gray-700 font-black text-sm">{playerScoreCard.draws}</p><span className="text-[10px] text-[#6d5238]">Draws</span></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: GAME SETUP LOBBY */}
        {currentView === "GAME_LOBBY" && (
          <div className="flex flex-col items-center justify-center h-full my-auto">
            <form onSubmit={handleStartGame} className="bg-[#dfcbaf] border border-[#c8b191] p-6 md:p-8 rounded-2xl shadow-xl w-full max-w-sm text-center">
              <div className="text-4xl mb-2">{gameMode === "ROBOT" ? "🤖" : "👥"}</div>
              <h2 className="text-[#4a3622] font-black text-lg tracking-tight uppercase mb-1">
                {gameMode === "ROBOT" ? "Robot Challenge Lobby" : "Friend Match Lobby"}
              </h2>
              <p className="text-[#6d5238] text-xs mb-6">Specify profile username identity card values.</p>
              <div className="text-left mb-5">
                <label className="text-[10px] font-bold text-[#6d5238] uppercase tracking-wider block mb-2">Player Nickname</label>
                <input 
                  type="text" 
                  value={inputName}
                  onChange={(e) => setInputName(e.target.value)}
                  placeholder="e.g. czo" 
                  maxLength={12}
                  className="w-full bg-[#ebd4b7] border border-[#c8b191] rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-[#b59570] text-[#4a3622] font-bold transition-colors"
                  required
                />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setCurrentView("DASHBOARD")} className="w-1/3 bg-[#c8b191] text-[#4a3622] font-bold py-3 rounded-xl text-xs uppercase tracking-wider">Cancel</button>
                <button type="submit" className="w-2/3 bg-[#b59570] hover:bg-[#9c7d59] text-white font-black py-3 rounded-xl transition-colors text-xs uppercase tracking-wider shadow-sm">Play</button>
              </div>
            </form>
          </div>
        )}

        {/* VIEW 3: ACTIVE GAME VIEWPORT (75% MAX CONTAINER CONSTRAINTS) */}
        {currentView === "ACTIVE_GAME" && (
          <div className="flex flex-col items-center justify-center h-full w-full max-w-5xl mx-auto relative gap-4 py-2">
            
            {/* TOP PANEL TURN IDENTITY HEADER BAR */}
            <div className="flex items-center justify-between bg-[#cfb593] border border-[#ba9d77] py-2.5 px-4 rounded-xl shadow w-full max-w-[75vw] md:max-w-[75vmin] text-sm font-extrabold text-[#4a3622]">
              <div className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded-full border border-black/40 shadow-sm transition-all duration-300 ${isCzoTurn ? 'bg-[#1a1a1a] scale-110 shadow-md' : 'bg-white shadow-md'}`} />
                <span>{isCzoTurn ? `${username}'s Turn (Black)` : (gameMode === "ROBOT" ? "Robot's Turn (White)" : "Friend's Turn (White)")}</span>
              </div>
              <div className="flex gap-3 text-xs font-bold text-[#6d5238]">
                <button onClick={() => setCurrentView("DASHBOARD")} className="hover:underline">About</button>
                <button onClick={handleResetMatchState} className="hover:underline">Restart</button>
              </div>
            </div>

            {/* TRADITIONAL HARDWOOD BOARD (GOBAN) */}
            <div className="bg-[#ccab81] p-4 rounded-2xl border-2 border-[#b59570] shadow-[0_16px_32px_rgba(90,66,43,0.25)] grid grid-cols-15 gap-0 aspect-square w-full max-w-[75vw] max-h-[75vh] md:max-w-[75vmin] relative" style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 100%)" }}>
              {board.map((row, rIdx) =>
                row.map((cell, cIdx) => (
                  <button
                    key={`${rIdx}-${cIdx}`}
                    onClick={() => handleCellClick(rIdx, cIdx)}
                    disabled={!!cell || !!winner || (gameMode === "ROBOT" && !isCzoTurn)}
                    className="flex items-center justify-center aspect-square relative disabled:cursor-not-allowed group touch-manipulation"
                  >
                    {/* Seamless Grid Intersection Lines */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className={`h-[1px] bg-[#5a422b]/40 absolute left-0 right-0 ${cIdx === 0 ? 'left-1/2' : ''} ${cIdx === 14 ? 'right-1/2' : ''}`}></div>
                      <div className={`w-[1px] bg-[#5a422b]/40 absolute top-0 bottom-0 ${rIdx === 0 ? 'top-1/2' : ''} ${rIdx === 14 ? 'bottom-1/2' : ''}`}></div>
                    </div>

                    {/* Hoshi Star Points */}
                    {isStarPoint(rIdx, cIdx) && !cell && (
                      <div className="w-[5px] h-[5px] rounded-full bg-[#5a422b] absolute pointer-events-none shadow-sm" />
                    )}
                    
                                        {/* Black Piece */}
                    {cell === "black" && (
                      <div className="w-[92%] h-[92%] rounded-full bg-gradient-to-br from-[#3a3a3a] via-[#1a1a1a] to-[#0a0a0a] shadow-[0_3px_6px_rgba(0,0,0,0.45),inset_0_1px_1px_rgba(255,255,255,0.2)] transform scale-100 z-10" />
                    )}

                    {/* White Piece */}
                    {cell === "white" && (
                      <div className="w-[92%] h-[92%] rounded-full bg-gradient-to-br from-[#ffffff] via-[#fcfcfc] to-[#e0e0e0] shadow-[0_3px_6px_rgba(0,0,0,0.35),inset_0_1px_2px_rgba(255,255,255,1)] transform scale-100 z-10" />
                    )}
                  </button>
                ))
              )}
            </div>

            {/* WINNER POPUP OVERLAY */}
            {winner && (
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center p-4 z-50 animate-fade-in">
                <div className="bg-[#dfcbaf] border-2 border-[#b59570] p-6 rounded-2xl max-w-xs w-full text-center shadow-2xl">
                  <div className="text-4xl mb-2">{winner === "Draw" ? "🤝" : "🏆"}</div>
                  <h3 className="text-lg font-black text-[#4a3622] uppercase tracking-tight">{winner === "Draw" ? "Tie Game!" : "Victory!"}</h3>
                  <p className="text-[#6d5238] text-xs mt-1 mb-4">
                    {winner === "Draw" ? "The field is filled up." : <span>Winner: <strong className="text-amber-900">{winner}</strong></span>}
                  </p>
                  <button onClick={handleResetMatchState} className="w-full bg-[#b59570] hover:bg-[#9c7d59] text-white font-black py-2 rounded-xl text-xs uppercase tracking-wider shadow-sm">Play Again</button>
                </div>
              </div>
            )}

            {/* CANVAS FOOTER CONTROL BAR */}
            <div className="w-full flex justify-between items-center px-1 max-w-[75vw] md:max-w-[75vmin]">
              <button onClick={() => setCurrentView("DASHBOARD")} className="text-[10px] text-rose-800 font-bold uppercase tracking-wider hover:underline">← Exit Arena</button>
              <button onClick={handleResetMatchState} className="px-3 py-1 bg-[#cfb593] border border-[#ba9d77] text-[10px] rounded font-bold uppercase tracking-wider text-[#4a3622]">
                Restart Game
              </button>
            </div>
          </div>
        )}

        {/* VIEW 4: LIVE RECORD LEADERBOARD VIEW */}
        {currentView === "LEADERBOARD" && (
          <div className="max-w-xl w-full mx-auto my-auto bg-[#dfcbaf] border border-[#c8b191] rounded-2xl p-5 shadow-xl">
            <div className="border-b border-[#c8b191] pb-3 mb-4">
              <h3 className="text-base font-black text-[#4a3622] uppercase tracking-tight">Global Leaderboard Score Sheet</h3>
              <p className="text-[#6d5238] text-xs">Top performing five-in-a-row connections matrices users.</p>
            </div>

            <div className="flex flex-col gap-1.5 font-mono text-xs">
              {leaderboardData.map((player) => (
                <div key={player.rank} className={`flex items-center justify-between p-3 rounded-xl border ${player.name === 'PlayerCzo' ? 'bg-[#b59570]/10 border-[#b59570]/40' : 'bg-[#e4d0b5] border-[#c8b191]'}`}>
                  <div className="flex items-center gap-3">
                    <span className={`w-5 font-bold ${player.rank <= 3 ? 'text-amber-400' : 'text-gray-500'}`}>#{player.rank}</span>
                    <span>{player.country}</span>
                    <span className={player.name === 'PlayerCzo' ? 'text-[#4a3622] font-black' : 'text-[#6d5238]'}>{player.name}</span>
                  </div>
                  <span className="font-bold text-[#4a3622]">{player.score} PTS</span>
                </div>
              ))}
            </div>

            <button onClick={() => setCurrentView("DASHBOARD")} className="w-full mt-5 bg-[#c8b191] hover:bg-[#b59570]/40 text-[#4a3622] font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider transition-colors text-center block">Back to Dashboard</button>
          </div>
        )}

      </section>
    </main>
  );
}
