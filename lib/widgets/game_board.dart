import 'package:flutter/material.dart';
import '../models/game_state.dart';
import 'block_widget.dart';

class GameBoard extends StatefulWidget {
  final GameState gameState;
  final VoidCallback onBlockTapped;

  const GameBoard({
    super.key,
    required this.gameState,
    required this.onBlockTapped,
  });

  @override
  State<GameBoard> createState() => _GameBoardState();
}

class _GameBoardState extends State<GameBoard>
    with SingleTickerProviderStateMixin {
  Set<String> highlightedBlocks = {};

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final boardWidth = constraints.maxWidth;
        final boardHeight = constraints.maxHeight;
        final cellSize = (boardWidth / widget.gameState.levelData.cols)
            .clamp(0.0, boardHeight / widget.gameState.levelData.rows);

        return Container(
          decoration: BoxDecoration(
            color: const Color(0xFFF5E6D3),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: const Color(0xFF8B6914),
              width: 3,
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.2),
                blurRadius: 10,
                offset: const Offset(0, 5),
              ),
            ],
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(9),
            child: Stack(
              children: [
                // Background gradient
                Container(
                  decoration: const BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [
                        Color(0xFF87CEEB),
                        Color(0xFFB0E0E6),
                      ],
                    ),
                  ),
                ),
                // Grid
                Center(
                  child: SizedBox(
                    width: cellSize * widget.gameState.levelData.cols,
                    height: cellSize * widget.gameState.levelData.rows,
                    child: _buildGrid(cellSize),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildGrid(double cellSize) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: List.generate(
        widget.gameState.levelData.rows,
        (row) => Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: List.generate(
            widget.gameState.levelData.cols,
            (col) => _buildCell(row, col, cellSize),
          ),
        ),
      ),
    );
  }

  Widget _buildCell(int row, int col, double cellSize) {
    final block = widget.gameState.board[row][col];
    if (block == null) {
      return SizedBox(width: cellSize, height: cellSize);
    }

    final key = '$row,$col';
    final isHighlighted = highlightedBlocks.contains(key);

    return BlockWidget(
      block: block,
      size: cellSize - 2,
      isHighlighted: isHighlighted,
      onTap: () => _handleTap(row, col),
    );
  }

  void _handleTap(int row, int col) {
    final connected = widget.gameState.findConnectedBlocks(row, col);
    if (connected.length < 2) return;

    // Show highlight briefly then execute
    setState(() {
      highlightedBlocks = connected.map((b) => '${b.row},${b.col}').toSet();
    });

    Future.delayed(const Duration(milliseconds: 150), () {
      widget.gameState.tapBlock(row, col);
      setState(() {
        highlightedBlocks.clear();
      });
      widget.onBlockTapped();
    });
  }
}
