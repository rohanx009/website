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

// Initialize the game
function initGame() {
    board = initializeBoard();
    selectedSquare = null;
    whiteTurn = true;
    moveHistory = [];
    capturedWhite = [];
    capturedBlack = [];
    renderBoard();
    updateDisplay();
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
    
    switch (pieceType) {
        case 'P': return isValidPawnMove(fromRow, fromCol, toRow, toCol, piece);
        case 'N': return isValidKnightMove(fromRow, fromCol, toRow, toCol);
        case 'B': return isValidBishopMove(fromRow, fromCol, toRow, toCol);
        case 'R': return isValidRookMove(fromRow, fromCol, toRow, toCol);
        case 'Q': return isValidQueenMove(fromRow, fromCol, toRow, toCol);
        case 'K': return isValidKingMove(fromRow, fromCol, toRow, toCol);
        default: return false;
    }
}

// Pawn movement validation
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
    
    return false;
}

// Knight movement validation
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
function isValidKingMove(fromRow, fromCol, toRow, toCol) {
    return Math.abs(toRow - fromRow) <= 1 && Math.abs(toCol - fromCol) <= 1;
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
    const piece = board[fromRow][fromCol];
    const capturedPiece = board[toRow][toCol];
    
    // Track captured pieces
    if (capturedPiece) {
        if (capturedPiece[0] === 'w') {
            capturedWhite.push(capturedPiece);
        } else {
            capturedBlack.push(capturedPiece);
        }
    }
    
    // Make the move
    board[toRow][toCol] = piece;
    board[fromRow][fromCol] = null;
    
    // Record move
    const from = String.fromCharCode(97 + fromCol) + (8 - fromRow);
    const to = String.fromCharCode(97 + toCol) + (8 - toRow);
    moveHistory.push({
        piece,
        from,
        to,
        captured: capturedPiece,
        fromRow, fromCol, toRow, toCol
    });
    
    // Switch turn
    whiteTurn = !whiteTurn;
    
    // Show success message
    const pieceSymbol = PIECES[piece];
    if (capturedPiece) {
        const capturedSymbol = PIECES[capturedPiece];
        showMessage(`${pieceSymbol} captured ${capturedSymbol} at ${to}!`, 'success');
    } else {
        showMessage(`${pieceSymbol} moved to ${to}`, 'success');
    }
}

// Update display
function updateDisplay() {
    // Update turn indicator
    const turnIndicator = document.getElementById('turn-indicator');
    if (whiteTurn) {
        turnIndicator.innerHTML = '<span class="turn-icon">⚪</span><span class="turn-text">White\'s Turn</span>';
        turnIndicator.style.background = 'linear-gradient(135deg, #0066ff 0%, #0044cc 100%)';
    } else {
        turnIndicator.innerHTML = '<span class="turn-icon">⚫</span><span class="turn-text">Black\'s Turn</span>';
        turnIndicator.style.background = 'linear-gradient(135deg, #ff0000 0%, #cc0000 100%)';
    }
    
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
    initGame();
    showMessage('New game started!', 'info');
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
    
    // Switch turn back
    whiteTurn = !whiteTurn;
    
    renderBoard();
    updateDisplay();
    showMessage('Move undone!', 'info');
}

// Show help
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

// Initialize game on load
window.onload = initGame;
