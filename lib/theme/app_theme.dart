import 'package:flutter/material.dart';

class AppTheme {
  static const Color primaryPurple = Color(0xFF6B2FA0);
  static const Color darkBlue = Color(0xFF1A1A3E);
  static const Color brightGreen = Color(0xFF4CAF50);
  static const Color brightYellow = Color(0xFFFFD700);
  static const Color brightRed = Color(0xFFE53935);
  static const Color brightBlue = Color(0xFF2196F3);
  static const Color brightOrange = Color(0xFFFF9800);

  static ThemeData get darkTheme => ThemeData(
        brightness: Brightness.dark,
        primaryColor: primaryPurple,
        scaffoldBackgroundColor: darkBlue,
        colorScheme: const ColorScheme.dark(
          primary: primaryPurple,
          secondary: brightYellow,
          surface: Color(0xFF2A2A5E),
        ),
        fontFamily: 'Roboto',
      );
}
