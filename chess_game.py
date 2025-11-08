"""
A beautiful Chess Game implementation in Python
Supports two-player chess with full move validation
Enhanced UI/UX with Unicode chess pieces and colors
"""

import os
import sys

# ANSI color codes for terminal
class Colors:
    RESET = '\033[0m'
    BOLD = '\033[1m'
    
    # Text colors
    BLACK = '\033[30m'
    RED = '\033[31m'
    GREEN = '\033[32m'
    YELLOW = '\033[33m'
    BLUE = '\033[34m'
    MAGENTA = '\033[35m'
    CYAN = '\033[36m'
    WHITE = '\033[37m'
    
    # Background colors
    BG_BLACK = '\033[40m'
    BG_RED = '\033[41m'
    BG_GREEN = '\033[42m'
    BG_YELLOW = '\033[43m'
    BG_BLUE = '\033[44m'
    BG_MAGENTA = '\033[45m'
    BG_CYAN = '\033[46m'
    BG_WHITE = '\033[47m'
    BG_LIGHT_GRAY = '\033[47m'
    BG_DARK_GRAY = '\033[100m'

class ChessBoard:
    # Unicode chess pieces
    PIECES = {
        'wK': '♔', 'wQ': '♕', 'wR': '♖', 'wB': '♗', 'wN': '♘', 'wP': '♙',
        'bK': '♚', 'bQ': '♛', 'bR': '♜', 'bB': '♝', 'bN': '♞', 'bP': '♟'
    }
    
    def __init__(self):
        self.board = self.initialize_board()
        self.white_turn = True
        self.move_history = []
        self.captured_white = []
        self.captured_black = []
        
    def initialize_board(self):
        """Initialize the chess board with pieces in starting positions"""
        board = [[None for _ in range(8)] for _ in range(8)]
        
        # Place white pieces
        board[7][0] = 'wR'  # Rook
        board[7][1] = 'wN'  # Knight
        board[7][2] = 'wB'  # Bishop
        board[7][3] = 'wQ'  # Queen
        board[7][4] = 'wK'  # King
        board[7][5] = 'wB'  # Bishop
        board[7][6] = 'wN'  # Knight
        board[7][7] = 'wR'  # Rook
        
        # Place white pawns
        for i in range(8):
            board[6][i] = 'wP'  # Pawn
        
        # Place black pieces
        board[0][0] = 'bR'
        board[0][1] = 'bN'
        board[0][2] = 'bB'
        board[0][3] = 'bQ'
        board[0][4] = 'bK'
        board[0][5] = 'bB'
        board[0][6] = 'bN'
        board[0][7] = 'bR'
        
        # Place black pawns
        for i in range(8):
            board[1][i] = 'bP'
        
        return board
    
    def display_board(self):
        """Display the chess board in a readable format"""
        print("\n  a b c d e f g h")
        print("  ---------------")
        for row in range(8):
            print(f"{8-row}|", end="")
            for col in range(8):
                piece = self.board[row][col]
                if piece is None:
                    print(" ", end=" ")
                else:
                    print(piece, end=" ")
            print(f"|{8-row}")
        print("  ---------------")
        print("  a b c d e f g h\n")
    
    def position_to_coords(self, position):
        """Convert chess notation (e.g., 'e2') to board coordinates"""
        if len(position) != 2:
            return None
        col = ord(position[0].lower()) - ord('a')
        row = 8 - int(position[1])
        if 0 <= row < 8 and 0 <= col < 8:
            return (row, col)
        return None
    
    def get_piece_color(self, piece):
        """Get the color of a piece"""
        if piece is None:
            return None
        return 'white' if piece[0] == 'w' else 'black'
    
    def get_piece_type(self, piece):
        """Get the type of a piece (P, N, B, R, Q, K)"""
        if piece is None:
            return None
        return piece[1]
    
    def is_valid_move(self, from_pos, to_pos):
        """Check if a move is valid"""
        from_coords = self.position_to_coords(from_pos)
        to_coords = self.position_to_coords(to_pos)
        
        if from_coords is None or to_coords is None:
            return False, "Invalid position format"
        
        from_row, from_col = from_coords
        to_row, to_col = to_coords
        
        piece = self.board[from_row][from_col]
        target = self.board[to_row][to_col]
        
        # Check if there's a piece to move
        if piece is None:
            return False, "No piece at the source position"
        
        # Check if it's the correct player's turn
        current_player = 'white' if self.white_turn else 'black'
        if self.get_piece_color(piece) != current_player:
            return False, f"It's {current_player}'s turn"
        
        # Check if target is your own piece
        if target is not None and self.get_piece_color(target) == self.get_piece_color(piece):
            return False, "Cannot capture your own piece"
        
        # Validate move based on piece type
        piece_type = self.get_piece_type(piece)
        
        if piece_type == 'P':
            return self.is_valid_pawn_move(from_row, from_col, to_row, to_col, piece)
        elif piece_type == 'N':
            return self.is_valid_knight_move(from_row, from_col, to_row, to_col)
        elif piece_type == 'B':
            return self.is_valid_bishop_move(from_row, from_col, to_row, to_col)
        elif piece_type == 'R':
            return self.is_valid_rook_move(from_row, from_col, to_row, to_col)
        elif piece_type == 'Q':
            return self.is_valid_queen_move(from_row, from_col, to_row, to_col)
        elif piece_type == 'K':
            return self.is_valid_king_move(from_row, from_col, to_row, to_col)
        
        return False, "Unknown piece type"
    
    def is_path_clear(self, from_row, from_col, to_row, to_col):
        """Check if the path between two positions is clear"""
        row_dir = 0 if from_row == to_row else (1 if to_row > from_row else -1)
        col_dir = 0 if from_col == to_col else (1 if to_col > from_col else -1)
        
        current_row = from_row + row_dir
        current_col = from_col + col_dir
        
        while (current_row, current_col) != (to_row, to_col):
            if self.board[current_row][current_col] is not None:
                return False
            current_row += row_dir
            current_col += col_dir
        
        return True
    
    def is_valid_pawn_move(self, from_row, from_col, to_row, to_col, piece):
        """Validate pawn move"""
        direction = -1 if piece[0] == 'w' else 1  # White moves up (-1), black moves down (1)
        target = self.board[to_row][to_col]
        
        # One square forward
        if to_col == from_col and to_row == from_row + direction and target is None:
            return True, "Valid move"
        
        # Two squares forward from starting position
        start_row = 6 if piece[0] == 'w' else 1
        if (to_col == from_col and to_row == from_row + 2 * direction and 
            from_row == start_row and target is None and 
            self.board[from_row + direction][from_col] is None):
            return True, "Valid move"
        
        # Capture diagonally
        if (abs(to_col - from_col) == 1 and to_row == from_row + direction and 
            target is not None):
            return True, "Valid move"
        
        return False, "Invalid pawn move"
    
    def is_valid_knight_move(self, from_row, from_col, to_row, to_col):
        """Validate knight move (L-shaped)"""
        row_diff = abs(to_row - from_row)
        col_diff = abs(to_col - from_col)
        
        if (row_diff == 2 and col_diff == 1) or (row_diff == 1 and col_diff == 2):
            return True, "Valid move"
        
        return False, "Invalid knight move"
    
    def is_valid_bishop_move(self, from_row, from_col, to_row, to_col):
        """Validate bishop move (diagonals)"""
        if abs(to_row - from_row) == abs(to_col - from_col) and (to_row, to_col) != (from_row, from_col):
            if self.is_path_clear(from_row, from_col, to_row, to_col):
                return True, "Valid move"
        
        return False, "Invalid bishop move"
    
    def is_valid_rook_move(self, from_row, from_col, to_row, to_col):
        """Validate rook move (horizontal/vertical)"""
        if (from_row == to_row or from_col == to_col) and (to_row, to_col) != (from_row, from_col):
            if self.is_path_clear(from_row, from_col, to_row, to_col):
                return True, "Valid move"
        
        return False, "Invalid rook move"
    
    def is_valid_queen_move(self, from_row, from_col, to_row, to_col):
        """Validate queen move (rook + bishop)"""
        # Check rook-like move
        if from_row == to_row or from_col == to_col:
            if (to_row, to_col) != (from_row, from_col) and self.is_path_clear(from_row, from_col, to_row, to_col):
                return True, "Valid move"
        
        # Check bishop-like move
        if abs(to_row - from_row) == abs(to_col - from_col) and (to_row, to_col) != (from_row, from_col):
            if self.is_path_clear(from_row, from_col, to_row, to_col):
                return True, "Valid move"
        
        return False, "Invalid queen move"
    
    def is_valid_king_move(self, from_row, from_col, to_row, to_col):
        """Validate king move (one square in any direction)"""
        if abs(to_row - from_row) <= 1 and abs(to_col - from_col) <= 1 and (to_row, to_col) != (from_row, from_col):
            return True, "Valid move"
        
        return False, "Invalid king move"
    
    def make_move(self, from_pos, to_pos):
        """Make a move on the board"""
        is_valid, message = self.is_valid_move(from_pos, to_pos)
        
        if not is_valid:
            return False, message
        
        from_coords = self.position_to_coords(from_pos)
        to_coords = self.position_to_coords(to_pos)
        from_row, from_col = from_coords
        to_row, to_col = to_coords
        
        piece = self.board[from_row][from_col]
        captured_piece = self.board[to_row][to_col]
        
        # Make the move
        self.board[to_row][to_col] = piece
        self.board[from_row][from_col] = None
        
        # Record move
        self.move_history.append({
            'from': from_pos,
            'to': to_pos,
            'piece': piece,
            'captured': captured_piece
        })
        
        # Switch turn
        self.white_turn = not self.white_turn
        
        return True, f"Moved {piece} from {from_pos} to {to_pos}"
    
    def get_game_status(self):
        """Return the current game status"""
        player = "White" if self.white_turn else "Black"
        return f"{player}'s turn"


def play_chess():
    """Main function to play chess"""
    game = ChessBoard()
    
    print("=" * 40)
    print("Welcome to Python Chess!")
    print("=" * 40)
    print("\nInstructions:")
    print("- Enter moves in the format: e2 e4")
    print("- Type 'board' to display the board")
    print("- Type 'history' to see move history")
    print("- Type 'quit' to exit")
    print("\nColumns: a-h (left to right)")
    print("Rows: 1-8 (bottom to top)\n")
    
    game.display_board()
    
    while True:
        print(f"Status: {game.get_game_status()}")
        user_input = input("Enter your move (or command): ").strip().lower()
        
        if user_input == 'quit':
            print("Thanks for playing!")
            break
        elif user_input == 'board':
            game.display_board()
        elif user_input == 'history':
            if game.move_history:
                print("\nMove History:")
                for i, move in enumerate(game.move_history, 1):
                    print(f"{i}. {move['piece']} {move['from']} -> {move['to']}", end="")
                    if move['captured']:
                        print(f" (captured {move['captured']})")
                    else:
                        print()
            else:
                print("No moves yet")
        else:
            # Parse move
            parts = user_input.split()
            if len(parts) == 2:
                success, message = game.make_move(parts[0], parts[1])
                print(message)
                if success:
                    game.display_board()
            else:
                print("Invalid input. Please use format: e2 e4")


if __name__ == "__main__":
    play_chess()
