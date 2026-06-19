import 'block.dart';

class LevelGoal {
  final BlockColor color;
  final int target;
  int current;

  LevelGoal({
    required this.color,
    required this.target,
    this.current = 0,
  });

  bool get isCompleted => current >= target;
}

class LevelData {
  final int levelNumber;
  final int rows;
  final int cols;
  final int maxMoves;
  final List<LevelGoal> goals;
  final int numColors;

  const LevelData({
    required this.levelNumber,
    this.rows = 9,
    this.cols = 8,
    required this.maxMoves,
    required this.goals,
    this.numColors = 5,
  });
}

class LevelGenerator {
  static LevelData getLevel(int levelNumber) {
    final difficulty = (levelNumber / 10).ceil().clamp(1, 5);
    final maxMoves = (20 - difficulty + 5).clamp(12, 25);
    final numColors = (3 + difficulty).clamp(3, 5);

    final goals = <LevelGoal>[];
    final colors = BlockColor.values.take(numColors).toList();
    final numGoals = (1 + levelNumber ~/ 5).clamp(1, 3);

    for (int i = 0; i < numGoals; i++) {
      final targetColor = colors[i % colors.length];
      final target = (20 + levelNumber * 3 + i * 10).clamp(20, 100);
      goals.add(LevelGoal(color: targetColor, target: target));
    }

    return LevelData(
      levelNumber: levelNumber,
      rows: 9,
      cols: 8,
      maxMoves: maxMoves,
      goals: goals,
      numColors: numColors,
    );
  }
}
