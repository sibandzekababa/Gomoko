"use client";
import { useState, useEffect } from "react";

export default function MatchCenter() {
  const [timeLeftPlayer1, setTimeLeftPlayer1] = useState(298); // 04:58
  const [timeLeftPlayer2, setTimeLeftPlayer2] = useState(299); // 04:59

  const [board, setBoard] = useState(Array(15).fill(null).map(() => Array(15).fill(null)));
  const [isCzoTurn, setIsCzoTurn] = useState(true); // True = Player (Green), False = Machine (Yellow)
  const [winner, setWinner] = useState(null);

  // Turn-based timer countdown loop
  useEffect(() => {
    if (winner) return;
    const timer = setInterval(() => {
      if (isCzoTurn) {
        setTimeLeftPlayer1((prev) => (prev > 0 ? prev - 1 : 0));
      } else {
        setTimeLeftPlayer2((prev) => (prev > 0 ? prev - 1 : 0));
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [isCzoTurn, winner]);

  // Automated Machine Turn trigger
  useEffect(() => {
    if (!isCzoTurn && !winner) {
      // Simulate consideration delay for realism
      const aiDelay = setTimeout(() => {
        makeMachineMove();
      }, 600);
      return () => clearTimeout(aiDelay);
    }
  }, [isCzoTurn, winner]);

  // Gomoku 5-in-a-row checker calculation
  const checkWin = (grid, r, c, player) => {
    const directions = [[[0, 1], [0, -1]], [[1, 0], [-1, 0]], [[1, 1], [-1, -1]], [[1, -1], [-1, 1]]];
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

  // Machine AI Move Engine (Finds winning moves, blocks player lines, or takes closest space)
  const makeMachineMove = () => {
    let bestMove = null;
    let fallbackMove = null;

    // Scan complete layout board grids
    for (let r = 0; r < 15; r++) {
      for (let c = 0; c < 15; c++) {
        if (board[r][c] === null) {
          if (!fallbackMove) fallbackMove = { r, c };

          // 1. Core Priority: Check if Machine can win on this square right now
          const testBoardAI = board.map((row) => [...row]);
          testBoardAI[r][c] = "yellow";
          if (checkWin(testBoardAI, r, c, "yellow")) {
            executeMove(r, c, "yellow");
            return;
          }

          // 2. Secondary Priority: Check if Player is about to win here and block them
          const testBoardPlayer = board.map((row) => [...row]);
          testBoardPlayer[r][c] = "green";
          if (checkWin(testBoardPlayer, r, c, "green")) {
            bestMove = { r, c };
          }
        }
      }
    }

    // Process optimal placement choice or use basic fallback cell
    const finalMove = bestMove || fallbackMove;
    if (finalMove) {
      executeMove(finalMove.r, finalMove.col || finalMove.c, "yellow");
    }
  };

  const executeMove = (r, c, player) => {
    const newBoard = board.map((row) => [...row]);
    newBoard[r][c] = player;
    setBoard(newBoard);

    if (checkWin(newBoard, r, c, player)) {
      setWinner(player === "green" ? "czo (You)" : "Machine Bot");
      return;
    }

    if (newBoard.every((row) => row.every((cell) => cell !== null))) {
      setWinner("Draw");
      return;
    }

    setIsCzoTurn(player === "yellow");
  };

  const handleCellClick = (rowIndex, colIndex) => {
    // Intercept clicks if it is the machine's turn or game has ended
    if (board[rowIndex][colIndex] || winner || !isCzoTurn) return;
    executeMove(rowIndex, colIndex, "green");
  };

  const handleReset = () => {
    setBoard(Array(15).fill(null).map(() => Array(15).fill(null)));
    setIsCzoTurn(true);
    setWinner(null);
    setTimeLeftPlayer1(298);
    setTimeLeftPlayer2(299);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <section className="flex flex-col items-center justify-between p-4 bg-[#0d1622] h-full relative font-sans">
      
      {/* HEADER COMPONENT BOARD */}
      <div className={`flex items-center gap-6 w-full justify-center max-w-2xl bg-[#131d2a] py-2 px-6 rounded-lg border transition-all duration-300 shadow-xl mt-2 ${isCzoTurn ? 'border-emerald-500/30' : 'border-amber-500/30'}`}>
        <div className="flex items-center gap-3">
          <div className="bg-[#10b981] text-black font-extrabold px-1.5 py-0.5 text-[10px] rounded-full">3</div>
          <span className="text-xs">🇭🇺</span>
          <span className={`font-bold text-sm ${isCzoTurn ? 'text-emerald-400' : 'text-gray-400'}`}>czo</span>
          <span className={`font-mono px-3 py-1 rounded font-bold text-sm bg-[#0a111a] ${isCzoTurn ? 'text-emerald-400' : 'text-gray-500'}`}>
            {formatTime(timeLeftPlayer1)}
          </span>
        </div>

        <div className="flex items-center gap-2 mx-2">
          <div className={`w-8 h-8 rounded-full bg-[#1b2a3c] flex items-center justify-center border-2 ${isCzoTurn ? 'border-emerald-500 scale-110 shadow-md' : 'border-transparent'} transition-all`}>🐸</div>
          <span className="text-gray-600 font-bold text-xs tracking-widest">VS</span>
          <div className={`w-8 h-8 rounded-full bg-[#1b2a3c] flex items-center justify-center border-2 ${!isCzoTurn ? 'border-amber-500 scale-110 shadow-md' : 'border-transparent'} transition-all`}>🤖</div>
        </div>

        <div className="flex items-center gap-3">
          <span className={`font-mono px-3 py-1 rounded font-bold text-sm bg-[#0a111a] ${!isCzoTurn ? 'text-amber-400' : 'text-gray-500'}`}>
            {formatTime(timeLeftPlayer2)}
          </span>
          <span className={`font-bold text-sm ${!isCzoTurn ? 'text-amber-400' : 'text-gray-400'}`}>Machine</span>
          <span className="text-xs">⚡</span>
          <div className="bg-[#10b981] text-black font-extrabold px-1.5 py-0.5 text-[10px] rounded-full">99</div>
        </div>
      </div>

      {/* POPUP CARD DIALOG */}
      {winner && (
        <div className="absolute top-24 bg-[#131d2a]/95 border-2 border-gray-800 p-6 rounded-2xl z-50 text-center shadow-2xl backdrop-blur-md max-w-xs w-full">
          <p className="text-amber-400 font-black text-xl tracking-tight uppercase">
            {winner === "Draw" ? "🤝 Draw Match!" : `🏆 ${winner} Wins!`}
          </p>
          <button onClick={handleReset} className="w-full mt-4 bg-[#10b981] hover:bg-[#059669] text-black font-black py-2 px-4 rounded-xl shadow-md transform active:scale-95 text-xs">
            Play Again
          </button>
        </div>
      )}

      {/* INTERACTION GAMEGRID CANVAS */}
      <div className="my-auto p-2 bg-[#121c2a] rounded-xl border border-gray-800/80 shadow-2xl">
        <div className="grid grid-cols-15 gap-[1px] bg-gray-900 p-[1px] max-w-[480px] w-screen aspect-square">
          {board.map((row, rowIndex) =>
            row.map((cell, colIndex) => (
              <button
                key={`${rowIndex}-${colIndex}`}
                onClick={() => handleCellClick(rowIndex, colIndex)}
                className="bg-[#0e1724] hover:bg-[#152234] aspect-square flex items-center justify-center relative transition-all focus:outline-none group"
              >
                <div className="absolute inset-0 flex items-center justify-center opacity-[0.08] pointer-events-none">
                  <div className="w-full h-[1px] bg-white absolute"></div>
                  <div className="h-full w-[1px] bg-white absolute"></div>
                </div>

                {!cell && !winner && isCzoTurn && (
                  <span className="w-3.5 h-3.5 rounded-full opacity-0 group-hover:opacity-30 absolute z-10 bg-emerald-400"></span>
                )}

                {cell === "green" && (
                  <span className="w-4 h-4 bg-emerald-400 rounded-full z-20 shadow-[0_0_10px_rgba(52,211,153,0.5)] transform scale-110"></span>
                )}
                {cell === "yellow" && (
                  <span className="w-4 h-4 bg-amber-400 rounded-full z-20 shadow-[0_0_10px_rgba(251,191,36,0.5)] transform scale-110"></span>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* ACTION SYSTEM FOOTER BAR */}
      <div className="w-full flex items-center justify-between px-4 mt-auto">
        <button onClick={handleReset} className="bg-[#182435] hover:bg-[#1f2e44] text-gray-400 hover:text-white text-xs font-semibold py-1.5 px-4 rounded-lg border border-gray-800 transition-colors">
          Reset Match
        </button>
        <span className="text-xl opacity-70">😀</span>
      </div>
    </section>
  );
}
