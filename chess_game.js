// Chess Game JavaScript
const PIECES = {
    'wK': '♔', 'wQ': '♕', 'wR': '♖', 'wB': '♗', 'wN': '♘', 'wP': '♙',
    'bK': '♚', 'bQ': '♛', 'bR': '♜', 'bB': '♝', 'bN': '♞', 'bP': '♟'
};

let board = [];
let selectedSquare = null;
let whiteTurn = true;
let moveHistory = [];
let capturedWhite = [];
let capturedBlack = [];
let hasMoved = {}; // Track which pieces have moved (for castling)
let enPassantTarget = null; // Track en passant opportunity
let gameOver = false;
let checkStatus = { white: false, black: false };

// Player data
let players = {
    white: { name: 'White Player', wins: 0, losses: 0, games: 0 },
    black: { name: 'Black Player', wins: 0, losses: 0, games: 0 }
};

// Player Database using localStorage (simulates SQL database)
const PlayerDB = {
    // Get all players
    getAllPlayers: function() {
        const data = localStorage.getItem('chessPlayers');
        return data ? JSON.parse(data) : {};
    },
    
    // Get specific player
    getPlayer: function(name) {
        const players = this.getAllPlayers();
        return players[name] || { name: name, wins: 0, losses: 0, games: 0, history: [] };
    },
    
    // Save/Update player
    savePlayer: function(name, data) {
        const players = this.getAllPlayers();
        players[name] = data;
        localStorage.setItem('chessPlayers', JSON.stringify(players));
    },
    
    // Record game result
    recordGame: function(whiteName, blackName, winner) {
        const whitePlayer = this.getPlayer(whiteName);
        const blackPlayer = this.getPlayer(blackName);
        
        whitePlayer.games++;
        blackPlayer.games++;
        
        const gameData = {
            date: new Date().toISOString(),
            opponent: blackName,
            result: winner === 'white' ? 'win' : (winner === 'black' ? 'loss' : 'draw')
        };
        
        const blackGameData = {
            date: new Date().toISOString(),
            opponent: whiteName,
            result: winner === 'black' ? 'win' : (winner === 'white' ? 'loss' : 'draw')
        };
        
        if (winner === 'white') {
            whitePlayer.wins++;
            blackPlayer.losses++;
        } else if (winner === 'black') {
            blackPlayer.wins++;
            whitePlayer.losses++;
        }
        
        if (!whitePlayer.history) whitePlayer.history = [];
        if (!blackPlayer.history) blackPlayer.history = [];
        
        whitePlayer.history.push(gameData);
        blackPlayer.history.push(blackGameData);
        
        this.savePlayer(whiteName, whitePlayer);
        this.savePlayer(blackName, blackPlayer);
    },
    
    // Get last played names
    getLastPlayers: function() {
        const lastPlayers = localStorage.getItem('lastPlayers');
        return lastPlayers ? JSON.parse(lastPlayers) : null;
    },
    
    // Save last played names
    saveLastPlayers: function(whiteName, blackName) {
        localStorage.setItem('lastPlayers', JSON.stringify({ white: whiteName, black: blackName }));
    }
};

// Initialize the game
function initGame() {
    board = initializeBoard();
    selectedSquare = null;
    whiteTurn = true;
    moveHistory = [];
    capturedWhite = [];
    capturedBlack = [];
    hasMoved = {};
    enPassantTarget = null;
    gameOver = false;
    checkStatus = { white: false, black: false };
    renderBoard();
    updateDisplay();
    updatePlayerStats();
}

// Register players
function registerPlayers(event) {
    event.preventDefault();
    
    const whiteName = document.getElementById('white-player-input').value.trim();
    const blackName = document.getElementById('black-player-input').value.trim();
    
    if (!whiteName || !blackName) {
        alert('Please enter both player names!');
        return;
    }
    
    if (whiteName === blackName) {
        alert('Players must have different names!');
        return;
    }
    
    // Load player data from database
    players.white = PlayerDB.getPlayer(whiteName);
    players.black = PlayerDB.getPlayer(blackName);
    
    players.white.name = whiteName;
    players.black.name = blackName;
    
    // Save as last players
    PlayerDB.saveLastPlayers(whiteName, blackName);
    
    // Update UI
    document.getElementById('white-player-name').textContent = whiteName;
    document.getElementById('black-player-name').textContent = blackName;
    
    // Close modal
    document.getElementById('player-registration-modal').style.display = 'none';
    
    // Start game
    initGame();
    showMessage(`🎮 Game started! ${whiteName} vs ${blackName}`, 'success');
}

// Load previous players
function loadPreviousPlayers() {
    const lastPlayers = PlayerDB.getLastPlayers();
    
    if (lastPlayers) {
        document.getElementById('white-player-input').value = lastPlayers.white;
        document.getElementById('black-player-input').value = lastPlayers.black;
        showMessage('📜 Previous players loaded!', 'info');
    } else {
        showMessage('No previous players found!', 'error');
    }
}

// Update player statistics display
function updatePlayerStats() {
    // Update names
    document.getElementById('white-name-display').textContent = players.white.name;
    document.getElementById('black-name-display').textContent = players.black.name;
    
    // Update stats
    document.getElementById('white-wins').textContent = players.white.wins;
    document.getElementById('white-losses').textContent = players.white.losses;
    document.getElementById('white-games').textContent = players.white.games;
    
    document.getElementById('black-wins').textContent = players.black.wins;
    document.getElementById('black-losses').textContent = players.black.losses;
    document.getElementById('black-games').textContent = players.black.games;
}

// Initialize board with starting positions
function initializeBoard() {
    const newBoard = Array(8).fill(null).map(() => Array(8).fill(null));
    
    // Place white pieces
    newBoard[7] = ['wR', 'wN', 'wB', 'wQ', 'wK', 'wB', 'wN', 'wR'];
    newBoard[6] = Array(8).fill('wP');
    
    // Place black pieces
    newBoard[0] = ['bR', 'bN', 'bB', 'bQ', 'bK', 'bB', 'bN', 'bR'];
    newBoard[1] = Array(8).fill('bP');
    
    return newBoard;
}

// Render the chessboard
function renderBoard() {
    const chessboard = document.getElementById('chessboard');
    chessboard.innerHTML = '';
    
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const square = document.createElement('div');
            square.className = 'square';
            square.className += (row + col) % 2 === 0 ? ' light' : ' dark';
            square.dataset.row = row;
            square.dataset.col = col;
            
            const piece = board[row][col];
            if (piece) {
                const pieceSpan = document.createElement('span');
                pieceSpan.className = 'piece ' + (piece[0] === 'w' ? 'white' : 'black');
                pieceSpan.textContent = PIECES[piece];
                square.appendChild(pieceSpan);
            }
            
            square.addEventListener('click', () => handleSquareClick(row, col));
            chessboard.appendChild(square);
        }
    }
}

// Handle square click
function handleSquareClick(row, col) {
    const piece = board[row][col];
    
    if (selectedSquare) {
        // Try to move
        if (isValidMove(selectedSquare.row, selectedSquare.col, row, col)) {
            makeMove(selectedSquare.row, selectedSquare.col, row, col);
            selectedSquare = null;
            renderBoard();
            updateDisplay();
        } else if (piece && piece[0] === (whiteTurn ? 'w' : 'b')) {
            // Select different piece
            selectedSquare = {row, col};
            renderBoard();
            highlightSquare(row, col);
            showValidMoves(row, col);
        } else {
            showMessage('Invalid move!', 'error');
            selectedSquare = null;
            renderBoard();
        }
    } else if (piece && piece[0] === (whiteTurn ? 'w' : 'b')) {
        // Select piece
        selectedSquare = {row, col};
        highlightSquare(row, col);
        showValidMoves(row, col);
    }
}

// Highlight selected square
function highlightSquare(row, col) {
    const squares = document.querySelectorAll('.square');
    const index = row * 8 + col;
    squares[index].classList.add('selected');
}

// Show valid moves for a piece
function showValidMoves(row, col) {
    const piece = board[row][col];
    if (!piece) return;
    
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            if (isValidMove(row, col, r, c)) {
                const squares = document.querySelectorAll('.square');
                const index = r * 8 + c;
                squares[index].classList.add('valid-move');
            }
        }
    }
}

// Check if move is valid
function isValidMove(fromRow, fromCol, toRow, toCol) {
    const piece = board[fromRow][fromCol];
    const target = board[toRow][toCol];

    if (!piece) return false;
    if (piece[0] !== (whiteTurn ? 'w' : 'b')) return false;
    if (target && target[0] === piece[0]) return false;
    if (fromRow === toRow && fromCol === toCol) return false;

    const pieceType = piece[1];
    let isValid = false;

    switch (pieceType) {
        case 'P': isValid = isValidPawnMove(fromRow, fromCol, toRow, toCol, piece); break;
        case 'N': isValid = isValidKnightMove(fromRow, fromCol, toRow, toCol); break;
        case 'B': isValid = isValidBishopMove(fromRow, fromCol, toRow, toCol); break;
        case 'R': isValid = isValidRookMove(fromRow, fromCol, toRow, toCol); break;
        case 'Q': isValid = isValidQueenMove(fromRow, fromCol, toRow, toCol); break;
        case 'K': isValid = isValidKingMove(fromRow, fromCol, toRow, toCol, piece); break;
        default: return false;
    }

    if (!isValid) return false;

    // Check if this move would leave or put own king in check
    return !wouldBeInCheck(fromRow, fromCol, toRow, toCol, piece[0]);
}// Pawn movement validation
function isValidPawnMove(fromRow, fromCol, toRow, toCol, piece) {
    const direction = piece[0] === 'w' ? -1 : 1;
    const startRow = piece[0] === 'w' ? 6 : 1;
    const target = board[toRow][toCol];

    // Move forward one square
    if (toCol === fromCol && toRow === fromRow + direction && !target) {
        return true;
    }

    // Move forward two squares from start
    if (toCol === fromCol && toRow === fromRow + 2 * direction &&
        fromRow === startRow && !target && !board[fromRow + direction][fromCol]) {
        return true;
    }

    // Capture diagonally
    if (Math.abs(toCol - fromCol) === 1 && toRow === fromRow + direction && target) {
        return true;
    }

    // En Passant capture
    if (Math.abs(toCol - fromCol) === 1 && toRow === fromRow + direction && !target) {
        if (enPassantTarget && toRow === enPassantTarget.row && toCol === enPassantTarget.col) {
            return true;
        }
    }

    return false;
}// Knight movement validation
function isValidKnightMove(fromRow, fromCol, toRow, toCol) {
    const rowDiff = Math.abs(toRow - fromRow);
    const colDiff = Math.abs(toCol - fromCol);
    return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);
}

// Bishop movement validation
function isValidBishopMove(fromRow, fromCol, toRow, toCol) {
    if (Math.abs(toRow - fromRow) !== Math.abs(toCol - fromCol)) return false;
    return isPathClear(fromRow, fromCol, toRow, toCol);
}

// Rook movement validation
function isValidRookMove(fromRow, fromCol, toRow, toCol) {
    if (fromRow !== toRow && fromCol !== toCol) return false;
    return isPathClear(fromRow, fromCol, toRow, toCol);
}

// Queen movement validation
function isValidQueenMove(fromRow, fromCol, toRow, toCol) {
    return isValidRookMove(fromRow, fromCol, toRow, toCol) || 
           isValidBishopMove(fromRow, fromCol, toRow, toCol);
}

// King movement validation
function isValidKingMove(fromRow, fromCol, toRow, toCol, piece) {
    // Normal king move (one square in any direction)
    if (Math.abs(toRow - fromRow) <= 1 && Math.abs(toCol - fromCol) <= 1) {
        return true;
    }

    // Castling
    if (Math.abs(toCol - fromCol) === 2 && fromRow === toRow) {
        const kingColor = piece[0];
        const row = kingColor === 'w' ? 7 : 0;
        
        // King must not have moved
        if (hasMoved[`${fromRow}-${fromCol}`]) return false;
        
        // Check if castling kingside or queenside
        const isKingside = toCol > fromCol;
        const rookCol = isKingside ? 7 : 0;
        const rook = board[row][rookCol];
        
        // Rook must exist and not have moved
        if (!rook || rook[1] !== 'R' || hasMoved[`${row}-${rookCol}`]) return false;
        
        // Path between king and rook must be clear
        const start = Math.min(fromCol, rookCol);
        const end = Math.max(fromCol, rookCol);
        for (let col = start + 1; col < end; col++) {
            if (board[row][col]) return false;
        }
        
        // King cannot be in check
        if (isKingInCheck(kingColor)) return false;
        
        // King cannot pass through check
        const direction = isKingside ? 1 : -1;
        for (let col = fromCol; col !== toCol + direction; col += direction) {
            if (wouldBeInCheck(fromRow, fromCol, fromRow, col, kingColor, true)) {
                return false;
            }
        }
        
        return true;
    }

    return false;
}

// Check if path is clear
function isPathClear(fromRow, fromCol, toRow, toCol) {
    const rowDir = toRow > fromRow ? 1 : (toRow < fromRow ? -1 : 0);
    const colDir = toCol > fromCol ? 1 : (toCol < fromCol ? -1 : 0);
    
    let currentRow = fromRow + rowDir;
    let currentCol = fromCol + colDir;
    
    while (currentRow !== toRow || currentCol !== toCol) {
        if (board[currentRow][currentCol]) return false;
        currentRow += rowDir;
        currentCol += colDir;
    }
    
    return true;
}

// Make a move
function makeMove(fromRow, fromCol, toRow, toCol) {
    if (gameOver) {
        showMessage('Game is over! Start a new game.', 'error');
        return;
    }

    const piece = board[fromRow][fromCol];
    let capturedPiece = board[toRow][toCol];
    const pieceType = piece[1];
    const pieceColor = piece[0];

    // Handle Castling
    if (pieceType === 'K' && Math.abs(toCol - fromCol) === 2) {
        const isKingside = toCol > fromCol;
        const rookCol = isKingside ? 7 : 0;
        const newRookCol = isKingside ? toCol - 1 : toCol + 1;
        
        // Move the rook
        board[fromRow][newRookCol] = board[fromRow][rookCol];
        board[fromRow][rookCol] = null;
        hasMoved[`${fromRow}-${rookCol}`] = true;
        
        showMessage(`${PIECES[piece]} castled ${isKingside ? 'kingside' : 'queenside'}!`, 'success');
    }
    
    // Handle En Passant capture
    if (pieceType === 'P' && enPassantTarget && toRow === enPassantTarget.row && toCol === enPassantTarget.col) {
        const capturedPawnRow = pieceColor === 'w' ? toRow + 1 : toRow - 1;
        capturedPiece = board[capturedPawnRow][toCol];
        board[capturedPawnRow][toCol] = null;
        
        if (capturedPiece) {
            if (capturedPiece[0] === 'w') {
                capturedWhite.push(capturedPiece);
            } else {
                capturedBlack.push(capturedPiece);
            }
        }
        showMessage(`${PIECES[piece]} captured en passant!`, 'success');
    } else if (capturedPiece) {
        // Track regular captured pieces
        if (capturedPiece[0] === 'w') {
            capturedWhite.push(capturedPiece);
        } else {
            capturedBlack.push(capturedPiece);
        }
    }

    // Clear en passant target (will be set again if applicable)
    enPassantTarget = null;

    // Set en passant target if pawn moves two squares
    if (pieceType === 'P' && Math.abs(toRow - fromRow) === 2) {
        const enPassantRow = (fromRow + toRow) / 2;
        enPassantTarget = { row: enPassantRow, col: toCol };
    }

    // Make the move
    board[toRow][toCol] = piece;
    board[fromRow][fromCol] = null;

    // Mark piece as having moved
    hasMoved[`${fromRow}-${fromCol}`] = true;
    hasMoved[`${toRow}-${toCol}`] = true;

    // Check for Pawn Promotion
    if (pieceType === 'P' && (toRow === 0 || toRow === 7)) {
        showPromotionModal(toRow, toCol);
        return; // Don't switch turn yet, wait for promotion choice
    }

    // Record move
    const from = String.fromCharCode(97 + fromCol) + (8 - fromRow);
    const to = String.fromCharCode(97 + toCol) + (8 - toRow);
    moveHistory.push({
        piece,
        from,
        to,
        captured: capturedPiece,
        fromRow, fromCol, toRow, toCol,
        enPassantTarget: enPassantTarget,
        hasMoved: {...hasMoved}
    });

    // Switch turn
    whiteTurn = !whiteTurn;

    // Check for check, checkmate, or stalemate
    updateCheckStatus();
    
    if (isCheckmate(!whiteTurn ? 'w' : 'b')) {
        gameOver = true;
        const winnerColor = whiteTurn ? 'black' : 'white';
        const winnerName = whiteTurn ? players.black.name : players.white.name;
        const loserName = whiteTurn ? players.white.name : players.black.name;
        
        // Record game in database
        PlayerDB.recordGame(players.white.name, players.black.name, winnerColor);
        
        // Update local player stats
        if (winnerColor === 'white') {
            players.white.wins++;
            players.black.losses++;
        } else {
            players.black.wins++;
            players.white.losses++;
        }
        players.white.games++;
        players.black.games++;
        updatePlayerStats();
        
        showMessage(`🏆 Checkmate! ${winnerName} wins!`, 'success');
        setTimeout(() => alert(`🏆 Checkmate!\n\n${winnerName} defeats ${loserName}!\n\nCongratulations!`), 500);
    } else if (isStalemate(!whiteTurn ? 'w' : 'b')) {
        gameOver = true;
        
        // Record draw in database
        PlayerDB.recordGame(players.white.name, players.black.name, 'draw');
        
        players.white.games++;
        players.black.games++;
        updatePlayerStats();
        
        showMessage(`Game over - Stalemate! It's a draw.`, 'info');
        setTimeout(() => alert(`Stalemate!\n\nThe game is a draw between ${players.white.name} and ${players.black.name}.`), 500);
    } else if (checkStatus[!whiteTurn ? 'white' : 'black']) {
        const checkedPlayer = !whiteTurn ? players.white.name : players.black.name;
        showMessage(`⚠️ Check! ${checkedPlayer}'s king is in danger!`, 'error');
    } else {
        // Show success message
        const pieceSymbol = PIECES[piece];
        if (capturedPiece) {
            const capturedSymbol = PIECES[capturedPiece];
            showMessage(`${pieceSymbol} captured ${capturedSymbol} at ${to}!`, 'success');
        } else {
            showMessage(`${pieceSymbol} moved to ${to}`, 'success');
        }
    }
}// Update display
function updateDisplay() {
    // Update turn indicator with player names
    const turnIndicator = document.getElementById('turn-indicator');
    const currentPlayer = whiteTurn ? players.white.name : players.black.name;
    const currentIcon = whiteTurn ? '⚪' : '⚫';
    
    if (whiteTurn) {
        turnIndicator.innerHTML = `<span class="turn-icon">${currentIcon}</span><span class="turn-text">${currentPlayer}'s Turn</span>`;
        turnIndicator.style.background = 'linear-gradient(135deg, #0066ff 0%, #0044cc 100%)';
    } else {
        turnIndicator.innerHTML = `<span class="turn-icon">${currentIcon}</span><span class="turn-text">${currentPlayer}'s Turn</span>`;
        turnIndicator.style.background = 'linear-gradient(135deg, #ff0000 0%, #cc0000 100%)';
    }
    
    // Update current turn text
    document.getElementById('current-turn').textContent = currentPlayer;

    // Update move count
    document.getElementById('move-count').textContent = moveHistory.length;

    // Update last move
    if (moveHistory.length > 0) {
        const lastMove = moveHistory[moveHistory.length - 1];
        const pieceSymbol = PIECES[lastMove.piece];
        document.getElementById('last-move').textContent =
            `${pieceSymbol} ${lastMove.from} → ${lastMove.to}`;
    }

    // Update captured pieces
    updateCapturedPieces();

    // Update move history
    updateMoveHistory();
}

// Update captured pieces display
function updateCapturedPieces() {
    const capturedWhiteDiv = document.getElementById('captured-white');
    const capturedBlackDiv = document.getElementById('captured-black');
    
    capturedWhiteDiv.innerHTML = capturedWhite.map(p => 
        `<span class="captured-piece" style="color: #0066ff;">${PIECES[p]}</span>`
    ).join('') || '<span style="color: #999;">None</span>';
    
    capturedBlackDiv.innerHTML = capturedBlack.map(p => 
        `<span class="captured-piece" style="color: #ff0000;">${PIECES[p]}</span>`
    ).join('') || '<span style="color: #999;">None</span>';
}

// Update move history display
function updateMoveHistory() {
    const historyDiv = document.getElementById('move-history');
    
    if (moveHistory.length === 0) {
        historyDiv.innerHTML = '<p class="no-moves">No moves yet</p>';
        return;
    }
    
    historyDiv.innerHTML = moveHistory.map((move, i) => {
        const pieceSymbol = PIECES[move.piece];
        const moveClass = move.piece[0] === 'w' ? 'white-move' : 'black-move';
        const captureText = move.captured ? ` ⚔ ${PIECES[move.captured]}` : '';
        return `<div class="move-item ${moveClass}">
            ${i + 1}. ${pieceSymbol} ${move.from} → ${move.to}${captureText}
        </div>`;
    }).join('');
    
    historyDiv.scrollTop = historyDiv.scrollHeight;
}

// Show message
function showMessage(text, type = 'info') {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = text;
    messageDiv.className = `message ${type} show`;
    
    setTimeout(() => {
        messageDiv.classList.remove('show');
    }, 3000);
}

// New game
function newGame() {
    if (moveHistory.length > 0) {
        if (!confirm('Start a new game? Current progress will be lost.')) {
            return;
        }
    }
    
    // Show player registration modal
    document.getElementById('player-registration-modal').style.display = 'block';
    
    // Pre-fill with current players
    document.getElementById('white-player-input').value = players.white.name;
    document.getElementById('black-player-input').value = players.black.name;
}

// Undo move
function undoMove() {
    if (moveHistory.length === 0) {
        showMessage('No moves to undo!', 'error');
        return;
    }

    const lastMove = moveHistory.pop();
    
    // Restore piece
    board[lastMove.fromRow][lastMove.fromCol] = lastMove.piece;
    board[lastMove.toRow][lastMove.toCol] = lastMove.captured;

    // Restore captured piece
    if (lastMove.captured) {
        if (lastMove.captured[0] === 'w') {
            capturedWhite.pop();
        } else {
            capturedBlack.pop();
        }
    }

    // Restore game state
    if (lastMove.enPassantTarget) {
        enPassantTarget = lastMove.enPassantTarget;
    } else {
        enPassantTarget = null;
    }
    
    if (lastMove.hasMoved) {
        hasMoved = lastMove.hasMoved;
    }
    
    gameOver = false;

    // Switch turn back
    whiteTurn = !whiteTurn;

    renderBoard();
    updateDisplay();
    updateCheckStatus();
    showMessage('Move undone!', 'info');
}// Show help
function showHelp() {
    document.getElementById('help-modal').style.display = 'block';
}

// Close help
function closeHelp() {
    document.getElementById('help-modal').style.display = 'none';
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('help-modal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
}

// AI Hint System - Analyzes board and suggests best move
function getAIHint() {
    const currentPlayer = whiteTurn ? 'w' : 'b';
    const allPossibleMoves = getAllPossibleMoves(currentPlayer);

    if (allPossibleMoves.length === 0) {
        showMessage('No valid moves available!', 'error');
        return;
    }

    // Evaluate each move and pick the best one
    const bestMove = evaluateBestMove(allPossibleMoves, currentPlayer);

    if (bestMove) {
        // Clear any previous hints
        clearAIHints();

        // Highlight the suggested move
        const fromSquare = document.querySelector(`[data-row="${bestMove.fromRow}"][data-col="${bestMove.fromCol}"]`);
        const toSquare = document.querySelector(`[data-row="${bestMove.toRow}"][data-col="${bestMove.toCol}"]`);

        if (fromSquare && toSquare) {
            fromSquare.classList.add('ai-hint');
            toSquare.classList.add('ai-hint');

            const pieceSymbol = PIECES[bestMove.piece];
            const fromPos = String.fromCharCode(97 + bestMove.fromCol) + (8 - bestMove.fromRow);
            const toPos = String.fromCharCode(97 + bestMove.toCol) + (8 - bestMove.toRow);

            showMessage(`🤖 AI suggests: Move ${pieceSymbol} from ${fromPos} to ${toPos} (Score: ${bestMove.score.toFixed(1)})`, 'info');

            // Clear hint after 5 seconds
            setTimeout(clearAIHints, 5000);
        }
    }
}

// Get all possible moves for a player
function getAllPossibleMoves(player) {
    const moves = [];

    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const piece = board[row][col];
            if (piece && piece[0] === player) {
                // Check all possible destinations
                for (let toRow = 0; toRow < 8; toRow++) {
                    for (let toCol = 0; toCol < 8; toCol++) {
                        if (isValidMove(row, col, toRow, toCol)) {
                            moves.push({
                                fromRow: row,
                                fromCol: col,
                                toRow: toRow,
                                toCol: toCol,
                                piece: piece,
                                captured: board[toRow][toCol]
                            });
                        }
                    }
                }
            }
        }
    }

    return moves;
}

// Evaluate and find the best move
function evaluateBestMove(moves, player) {
    let bestMove = null;
    let bestScore = -Infinity;

    for (const move of moves) {
        const score = evaluateMove(move, player);
        move.score = score;

        if (score > bestScore) {
            bestScore = score;
            bestMove = move;
        }
    }

    return bestMove;
}

// Evaluate a move's quality
function evaluateMove(move, player) {
    let score = 0;

    // Piece values
    const pieceValues = {
        'P': 10,  // Pawn
        'N': 30,  // Knight
        'B': 30,  // Bishop
        'R': 50,  // Rook
        'Q': 90,  // Queen
        'K': 900  // King
    };

    // 1. Capturing opponent pieces is good
    if (move.captured) {
        const capturedType = move.captured[1];
        score += pieceValues[capturedType] * 10;
    }

    // 2. Moving to center is good (control center)
    const centerDistance = Math.abs(3.5 - move.toRow) + Math.abs(3.5 - move.toCol);
    score += (7 - centerDistance) * 5;

    // 3. Protecting pieces is good
    score += countProtectedPieces(move, player) * 3;

    // 4. Developing pieces (not pawns) early is good
    const pieceType = move.piece[1];
    if (pieceType !== 'P' && pieceType !== 'K') {
        const startRow = player === 'w' ? 7 : 0;
        if (move.fromRow === startRow || move.fromRow === (player === 'w' ? 6 : 1)) {
            score += 8; // Bonus for developing pieces
        }
    }

    // 5. Advancing pawns is good
    if (pieceType === 'P') {
        const advancement = player === 'w' ? (move.fromRow - move.toRow) : (move.toRow - move.fromRow);
        score += advancement * 3;
    }

    // 6. Don't move into danger
    if (isSquareUnderAttack(move.toRow, move.toCol, player === 'w' ? 'b' : 'w')) {
        score -= pieceValues[pieceType] * 5;
    }

    // 7. Attack opponent pieces
    score += countAttackedPieces(move, player) * 4;

    // Add some randomness for variety (±10%)
    score += (Math.random() - 0.5) * (score * 0.2);

    return score;
}

// Check if a square is under attack
function isSquareUnderAttack(row, col, byPlayer) {
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const piece = board[r][c];
            if (piece && piece[0] === byPlayer) {
                if (isValidMove(r, c, row, col)) {
                    return true;
                }
            }
        }
    }
    return false;
}

// Count how many friendly pieces this move would protect
function countProtectedPieces(move, player) {
    let count = 0;
    const tempPiece = board[move.toRow][move.toCol];
    board[move.toRow][move.toCol] = move.piece;
    board[move.fromRow][move.fromCol] = null;

    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const piece = board[row][col];
            if (piece && piece[0] === player && !(row === move.toRow && col === move.toCol)) {
                if (isValidMove(move.toRow, move.toCol, row, col)) {
                    count++;
                }
            }
        }
    }

    // Restore board
    board[move.fromRow][move.fromCol] = move.piece;
    board[move.toRow][move.toCol] = tempPiece;

    return count;
}

// Count how many opponent pieces this move would attack
function countAttackedPieces(move, player) {
    let count = 0;
    const opponent = player === 'w' ? 'b' : 'w';
    const tempPiece = board[move.toRow][move.toCol];
    board[move.toRow][move.toCol] = move.piece;
    board[move.fromRow][move.fromCol] = null;

    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const piece = board[row][col];
            if (piece && piece[0] === opponent) {
                if (isValidMove(move.toRow, move.toCol, row, col)) {
                    count++;
                }
            }
        }
    }

    // Restore board
    board[move.fromRow][move.fromCol] = move.piece;
    board[move.toRow][move.toCol] = tempPiece;

    return count;
}

// Clear AI hint highlights
function clearAIHints() {
    const hints = document.querySelectorAll('.ai-hint');
    hints.forEach(hint => hint.classList.remove('ai-hint'));
}

// Check if a king is in check
function isKingInCheck(color) {
    // Find the king
    let kingRow, kingCol;
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const piece = board[row][col];
            if (piece === color + 'K') {
                kingRow = row;
                kingCol = col;
                break;
            }
        }
        if (kingRow !== undefined) break;
    }

    // Check if any opponent piece can attack the king
    const opponent = color === 'w' ? 'b' : 'w';
    return isSquareUnderAttack(kingRow, kingCol, opponent);
}

// Check if a move would put/leave the king in check
function wouldBeInCheck(fromRow, fromCol, toRow, toCol, color, skipActualMove = false) {
    // Simulate the move
    const piece = board[fromRow][fromCol];
    const capturedPiece = board[toRow][toCol];
    
    if (!skipActualMove) {
        board[toRow][toCol] = piece;
        board[fromRow][fromCol] = null;
    }

    const inCheck = isKingInCheck(color);

    // Undo the move
    if (!skipActualMove) {
        board[fromRow][fromCol] = piece;
        board[toRow][toCol] = capturedPiece;
    }

    return inCheck;
}

// Update check status for both players
function updateCheckStatus() {
    checkStatus.white = isKingInCheck('w');
    checkStatus.black = isKingInCheck('b');
}

// Check if a player is in checkmate
function isCheckmate(color) {
    if (!isKingInCheck(color)) return false;
    return !hasLegalMoves(color);
}

// Check if a player is in stalemate
function isStalemate(color) {
    if (isKingInCheck(color)) return false;
    return !hasLegalMoves(color);
}

// Check if a player has any legal moves
function hasLegalMoves(color) {
    for (let fromRow = 0; fromRow < 8; fromRow++) {
        for (let fromCol = 0; fromCol < 8; fromCol++) {
            const piece = board[fromRow][fromCol];
            if (piece && piece[0] === color) {
                // Check all possible destinations
                for (let toRow = 0; toRow < 8; toRow++) {
                    for (let toCol = 0; toCol < 8; toCol++) {
                        // Temporarily set the turn to match the color we're checking
                        const originalTurn = whiteTurn;
                        whiteTurn = (color === 'w');
                        
                        if (isValidMove(fromRow, fromCol, toRow, toCol)) {
                            whiteTurn = originalTurn;
                            return true;
                        }
                        
                        whiteTurn = originalTurn;
                    }
                }
            }
        }
    }
    return false;
}

// Show pawn promotion modal
function showPromotionModal(row, col) {
    const color = board[row][col][0];
    const modal = document.getElementById('promotion-modal');
    const promotionPieces = document.getElementById('promotion-pieces');
    
    promotionPieces.innerHTML = '';
    
    const pieces = ['Q', 'R', 'B', 'N'];
    const pieceNames = { Q: 'Queen', R: 'Rook', B: 'Bishop', N: 'Knight' };
    
    pieces.forEach(pieceType => {
        const button = document.createElement('button');
        button.className = 'promotion-choice';
        button.textContent = PIECES[color + pieceType];
        button.title = pieceNames[pieceType];
        button.onclick = () => promotePawn(row, col, pieceType);
        promotionPieces.appendChild(button);
    });
    
    modal.style.display = 'block';
}

// Promote pawn to chosen piece
function promotePawn(row, col, pieceType) {
    const color = board[row][col][0];
    board[row][col] = color + pieceType;
    
    document.getElementById('promotion-modal').style.display = 'none';
    
    // Switch turn after promotion
    whiteTurn = !whiteTurn;
    
    // Check for check, checkmate, or stalemate
    updateCheckStatus();
    
    if (isCheckmate(!whiteTurn ? 'w' : 'b')) {
        gameOver = true;
        const winnerColor = whiteTurn ? 'black' : 'white';
        const winnerName = whiteTurn ? players.black.name : players.white.name;
        const loserName = whiteTurn ? players.white.name : players.black.name;
        
        // Record game in database
        PlayerDB.recordGame(players.white.name, players.black.name, winnerColor);
        
        // Update local player stats
        if (winnerColor === 'white') {
            players.white.wins++;
            players.black.losses++;
        } else {
            players.black.wins++;
            players.white.losses++;
        }
        players.white.games++;
        players.black.games++;
        updatePlayerStats();
        
        showMessage(`🏆 Checkmate! ${winnerName} wins!`, 'success');
        setTimeout(() => alert(`🏆 Checkmate!\n\n${winnerName} defeats ${loserName}!\n\nCongratulations!`), 500);
    } else if (isStalemate(!whiteTurn ? 'w' : 'b')) {
        gameOver = true;
        
        // Record draw in database
        PlayerDB.recordGame(players.white.name, players.black.name, 'draw');
        
        players.white.games++;
        players.black.games++;
        updatePlayerStats();
        
        showMessage(`Game over - Stalemate! It's a draw.`, 'info');
        setTimeout(() => alert(`Stalemate!\n\nThe game is a draw between ${players.white.name} and ${players.black.name}.`), 500);
    } else if (checkStatus[!whiteTurn ? 'white' : 'black']) {
        const checkedPlayer = !whiteTurn ? players.white.name : players.black.name;
        showMessage(`⚠️ Check! ${checkedPlayer}'s king is in danger!`, 'error');
    }
    
    renderBoard();
    updateDisplay();
    
    showMessage(`♟️ Pawn promoted to ${PIECES[color + pieceType]}!`, 'success');
}

// Initialize game on load
window.onload = initGame;
