const board = document.getElementById('board');
const redScoreElement = document.getElementById('red-score');
const blackScoreElement = document.getElementById('black-score');
const currentTurnElement = document.getElementById('current-turn');
const captureSound = document.getElementById('captureSound');

let gameState = {
    board: [],
    currentPlayer: 'red',
    selectedPiece: null,
    redScore: 12,
    blackScore: 12,
    selectorPosition: { row: 0, col: 0 },
    availableMoves: []
};

function initializeBoard() {
    for (let row = 0; row < 8; row++) {
        gameState.board[row] = [];
        for (let col = 0; col < 8; col++) {
            const square = document.createElement('div');
            square.classList.add('square');
            square.classList.add((row + col) % 2 === 0 ? 'light' : 'dark');
            square.dataset.row = row;
            square.dataset.col = col;
            board.appendChild(square);

            let piece = null;
            if ((row + col) % 2 !== 0) {
                if (row < 3) {
                    piece = { color: 'black', isKing: false };
                } else if (row > 4) {
                    piece = { color: 'red', isKing: false };
                }
            }
            gameState.board[row][col] = piece;
            if (piece) {
                const pieceElement = document.createElement('div');
                pieceElement.classList.add('piece', piece.color);
                square.appendChild(pieceElement);
            }
        }
    }
    updateBoard();
}

function handleKeyPress(event) {
    const { row, col } = gameState.selectorPosition;
    let newRow = row;
    let newCol = col;

    switch (event.key) {
        case 'ArrowUp':
            newRow = Math.max(0, row - 1);
            break;
        case 'ArrowDown':
            newRow = Math.min(7, row + 1);
            break;
        case 'ArrowLeft':
            newCol = Math.max(0, col - 1);
            break;
        case 'ArrowRight':
            newCol = Math.min(7, col + 1);
            break;
        case ' ':
            handleSelection(row, col);
            break;
    }

    gameState.selectorPosition = { row: newRow, col: newCol };
    updateBoard();
}

function handleSelection(row, col) {
    const piece = gameState.board[row][col];

    if (gameState.selectedPiece) {
        const startRow = gameState.selectedPiece.row;
        const startCol = gameState.selectedPiece.col;
        if (isValidMove(startRow, startCol, row, col)) {
            movePiece(startRow, startCol, row, col);
            if (!canJumpAgain(row, col)) {
                gameState.currentPlayer = gameState.currentPlayer === 'red' ? 'black' : 'red';
                gameState.selectedPiece = null;
                updateTurnIndicator();
            } else {
                gameState.selectedPiece = { row, col };
            }
        } else {
            gameState.selectedPiece = null;
        }
    } else if (piece && piece.color === gameState.currentPlayer) {
        gameState.selectedPiece = { row, col };
        gameState.availableMoves = getAvailableMoves(row, col);
    }

    updateBoard();
}

function isValidMove(startRow, startCol, endRow, endCol) {
    return gameState.availableMoves.some(move => move.row === endRow && move.col === endCol);
}

function getAvailableMoves(row, col) {
    const piece = gameState.board[row][col];
    if (!piece) return [];

    const moves = [];
    const directions = piece.isKing ? [-1, 1] : [piece.color === 'red' ? -1 : 1];

    for (let rowDir of directions) {
        for (let colDir of [-1, 1]) {
            // Check for single moves
            let newRow = row + rowDir;
            let newCol = col + colDir;
            if (isValidSquare(newRow, newCol) && !gameState.board[newRow][newCol]) {
                moves.push({ row: newRow, col: newCol });
            }

            // Check for jumps
            newRow = row + 2 * rowDir;
            newCol = col + 2 * colDir;
            if (isValidSquare(newRow, newCol) && !gameState.board[newRow][newCol]) {
                const jumpedRow = row + rowDir;
                const jumpedCol = col + colDir;
                const jumpedPiece = gameState.board[jumpedRow][jumpedCol];
                if (jumpedPiece && jumpedPiece.color !== piece.color) {
                    moves.push({ row: newRow, col: newCol });
                }
            }
        }
    }

    return moves;
}

function isValidSquare(row, col) {
    return row >= 0 && row < 8 && col >= 0 && col < 8;
}

function movePiece(startRow, startCol, endRow, endCol) {
    const piece = gameState.board[startRow][startCol];
    gameState.board[endRow][endCol] = piece;
    gameState.board[startRow][startCol] = null;

    if (Math.abs(endRow - startRow) === 2) {
        const jumpedRow = (startRow + endRow) / 2;
        const jumpedCol = (startCol + endCol) / 2;
        const jumpedPiece = gameState.board[jumpedRow][jumpedCol];
        gameState.board[jumpedRow][jumpedCol] = null;

        if (jumpedPiece.color === 'red') {
            gameState.redScore--;
        } else {
            gameState.blackScore--;
        }

        captureSound.currentTime = 0;
        captureSound.play().catch(e => console.error("Error playing sound:", e));
    }

    if ((piece.color === 'red' && endRow === 0) || (piece.color === 'black' && endRow === 7)) {
        piece.isKing = true;
    }

    updateScoreboard();
}

function canJumpAgain(row, col) {
    const jumps = getAvailableMoves(row, col).filter(move => Math.abs(move.row - row) === 2);
    return jumps.length > 0;
}

function updateBoard() {
    const squares = document.querySelectorAll('.square');
    squares.forEach(square => {
        const row = parseInt(square.dataset.row);
        const col = parseInt(square.dataset.col);
        const piece = gameState.board[row][col];

        square.innerHTML = '';
        if (piece) {
            const pieceElement = document.createElement('div');
            pieceElement.classList.add('piece', piece.color);
            if (piece.isKing) {
                pieceElement.classList.add('king');
            }
            square.appendChild(pieceElement);
        }

        square.classList.remove('selected', 'available-move');
        if (row === gameState.selectorPosition.row && col === gameState.selectorPosition.col) {
            square.classList.add('selected');
        }
        if (gameState.availableMoves.some(move => move.row === row && move.col === col)) {
            square.classList.add('available-move');
        }
    });
}

function updateScoreboard() {
    redScoreElement.textContent = gameState.redScore;
    blackScoreElement.textContent = gameState.blackScore;
}

function updateTurnIndicator() {
    currentTurnElement.textContent = gameState.currentPlayer.charAt(0).toUpperCase() + gameState.currentPlayer.slice(1);
}

initializeBoard();
updateScoreboard();
updateTurnIndicator();
document.addEventListener('keydown', handleKeyPress);
