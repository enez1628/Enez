import 'package:flutter/material.dart';

enum BlockColor {
  red,
  blue,
  green,
  yellow,
  purple,
}

extension BlockColorExtension on BlockColor {
  Color get color {
    switch (this) {
      case BlockColor.red:
        return const Color(0xFFE53935);
      case BlockColor.blue:
        return const Color(0xFF1E88E5);
      case BlockColor.green:
        return const Color(0xFF43A047);
      case BlockColor.yellow:
        return const Color(0xFFFDD835);
      case BlockColor.purple:
        return const Color(0xFF8E24AA);
    }
  }

  Color get darkColor {
    switch (this) {
      case BlockColor.red:
        return const Color(0xFFB71C1C);
      case BlockColor.blue:
        return const Color(0xFF0D47A1);
      case BlockColor.green:
        return const Color(0xFF1B5E20);
      case BlockColor.yellow:
        return const Color(0xFFF9A825);
      case BlockColor.purple:
        return const Color(0xFF4A148C);
    }
  }

  Color get lightColor {
    switch (this) {
      case BlockColor.red:
        return const Color(0xFFFF8A80);
      case BlockColor.blue:
        return const Color(0xFF82B1FF);
      case BlockColor.green:
        return const Color(0xFFB9F6CA);
      case BlockColor.yellow:
        return const Color(0xFFFFF59D);
      case BlockColor.purple:
        return const Color(0xFFE1BEE7);
    }
  }
}

enum BlockType {
  normal,
  bubble,
  egg,
  arrow,
}

class Block {
  BlockColor blockColor;
  BlockType type;
  int row;
  int col;
  bool isMatched;
  bool isAnimating;

  Block({
    required this.blockColor,
    this.type = BlockType.normal,
    required this.row,
    required this.col,
    this.isMatched = false,
    this.isAnimating = false,
  });

  Block copyWith({
    BlockColor? blockColor,
    BlockType? type,
    int? row,
    int? col,
    bool? isMatched,
    bool? isAnimating,
  }) {
    return Block(
      blockColor: blockColor ?? this.blockColor,
      type: type ?? this.type,
      row: row ?? this.row,
      col: col ?? this.col,
      isMatched: isMatched ?? this.isMatched,
      isAnimating: isAnimating ?? this.isAnimating,
    );
  }
}
