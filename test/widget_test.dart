import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:bird_match_puzzle/main.dart';

void main() {
  testWidgets('App launches successfully', (WidgetTester tester) async {
    await tester.pumpWidget(const BirdMatchApp());
    expect(find.byType(MaterialApp), findsOneWidget);
  });
}
