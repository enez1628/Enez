import 'dart:math';
import 'block.dart';
import 'level.dart';

class GameState {
  final LevelData levelData;
  late List<List<Block?>> board;
  late int movesLeft;
  late List<LevelGoal> goals;
  int score;
  bool isGameOver;
  bool isLevelComplete;
  final Random _random = Random();

  GameState({required this.levelData})
      : score = 0,
        isGameOver = false,
        isLevelComplete = false {
    movesLeft = levelData.maxMoves;
    goals = levelData.goals;
    _initBoard();
  }

  void _initBoard() {
    board = List.generate(
      levelData.rows,
      (row) => List.generate(
        levelData.cols,
        (col) => _createRandomBlock(row, col),
      ),
    );
  }

  Block _createRandomBlock(int row, int col) {
    final colors = BlockColor.values.take(levelData.numColors).toList();
    final color = colors[_random.nextInt(colors.length)];
    return Block(blockColor: color, row: row, col: col);
  }

  List<Block> findConnectedBlocks(int row, int col) {
    if (board[row][col] == null) return [];

    final targetColor = board[row][col]!.blockColor;
    final visited = <String>{};
    final connected = <Block>[];

    void dfs(int r, int c) {
      final key = '$r,$c';
      if (visited.contains(key)) return;
      if (r < 0 || r >= levelData.rows || c < 0 || c >= levelData.cols) return;
      if (board[r][c] == null) return;
      if (board[r][c]!.blockColor != targetColor) return;

      visited.add(key);
      connected.add(board[r][c]!);

      dfs(r - 1, c);
      dfs(r + 1, c);
      dfs(r, c - 1);
      dfs(r, c + 1);
    }

    dfs(row, col);
    return connected;
  }

  bool tapBlock(int row, int col) {
    if (isGameOver || isLevelComplete) return false;
    if (board[row][col] == null) return false;

    final connected = findConnectedBlocks(row, col);
    if (connected.length < 2) return false;

    final tappedColor = board[row][col]!.blockColor;

    // Remove matched blocks
    for (final block in connected) {
      board[block.row][block.col] = null;
    }

    // Update goals
    for (final goal in goals) {
      if (goal.color == tappedColor) {
        goal.current += connected.length;
      }
    }

    // Calculate score
    score += connected.length * 10 + (connected.length > 5 ? connected.length * 5 : 0);

    // Apply gravity
    _applyGravity();

    // Fill empty spaces
    _fillEmpty();

    // Decrease moves
    movesLeft--;

    // Check win/lose
    _checkGameStatus();

    return true;
  }

  void _applyGravity() {
    for (int col = 0; col < levelData.cols; col++) {
      int writeRow = levelData.rows - 1;
      for (int row = levelData.rows - 1; row >= 0; row--) {
        if (board[row][col] != null) {
          if (row != writeRow) {
            board[writeRow][col] = board[row][col];
            board[writeRow][col]!.row = writeRow;
            board[writeRow][col]!.col = col;
            board[row][col] = null;
          }
          writeRow--;
        }
      }
    }
  }

  void _fillEmpty() {
    for (int col = 0; col < levelData.cols; col++) {
      for (int row = 0; row < levelData.rows; row++) {
        if (board[row][col] == null) {
          board[row][col] = _createRandomBlock(row, col);
        }
      }
    }
  }

  void _checkGameStatus() {
    if (goals.every((g) => g.isCompleted)) {
      isLevelComplete = true;
      return;
    }
    if (movesLeft <= 0) {
      isGameOver = true;
    }
  }

  bool hasValidMoves() {
    for (int row = 0; row < levelData.rows; row++) {
      for (int col = 0; col < levelData.cols; col++) {
        if (board[row][col] != null) {
          final connected = findConnectedBlocks(row, col);
          if (connected.length >= 2) return true;
        }
      }
    }
    return false;
  }
}
