import 'package:flutter/material.dart';
import '../models/block.dart';

class BlockWidget extends StatelessWidget {
  final Block block;
  final double size;
  final bool isHighlighted;
  final VoidCallback onTap;

  const BlockWidget({
    super.key,
    required this.block,
    required this.size,
    this.isHighlighted = false,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        width: size,
        height: size,
        margin: const EdgeInsets.all(1),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(size * 0.2),
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              block.blockColor.lightColor,
              block.blockColor.color,
              block.blockColor.darkColor,
            ],
          ),
          boxShadow: isHighlighted
              ? [
                  BoxShadow(
                    color: block.blockColor.color.withOpacity(0.6),
                    blurRadius: 8,
                    spreadRadius: 2,
                  )
                ]
              : [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.3),
                    offset: const Offset(1, 2),
                    blurRadius: 3,
                  )
                ],
        ),
        child: Stack(
          children: [
            // Face expression
            Center(
              child: _buildFace(),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFace() {
    return CustomPaint(
      size: Size(size * 0.6, size * 0.6),
      painter: BlockFacePainter(isHighlighted: isHighlighted),
    );
  }
}

class BlockFacePainter extends CustomPainter {
  final bool isHighlighted;

  BlockFacePainter({this.isHighlighted = false});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.white.withOpacity(0.9)
      ..style = PaintingStyle.fill;

    final eyeRadius = size.width * 0.08;
    final eyeY = size.height * 0.4;

    // Left eye
    canvas.drawCircle(
      Offset(size.width * 0.35, eyeY),
      eyeRadius,
      paint,
    );
    // Right eye
    canvas.drawCircle(
      Offset(size.width * 0.65, eyeY),
      eyeRadius,
      paint,
    );

    // Pupils
    paint.color = Colors.black87;
    canvas.drawCircle(
      Offset(size.width * 0.35, eyeY),
      eyeRadius * 0.5,
      paint,
    );
    canvas.drawCircle(
      Offset(size.width * 0.65, eyeY),
      eyeRadius * 0.5,
      paint,
    );

    // Mouth
    if (isHighlighted) {
      paint.color = Colors.white.withOpacity(0.9);
      paint.style = PaintingStyle.stroke;
      paint.strokeWidth = 1.5;
      final mouthPath = Path();
      mouthPath.moveTo(size.width * 0.35, size.height * 0.6);
      mouthPath.quadraticBezierTo(
        size.width * 0.5,
        size.height * 0.75,
        size.width * 0.65,
        size.height * 0.6,
      );
      canvas.drawPath(mouthPath, paint);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
}
