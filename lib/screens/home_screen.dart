import 'package:flutter/material.dart';
import 'game_screen.dart';
import 'shop_screen.dart';
import 'events_screen.dart';
import 'village_screen.dart';
import 'rewards_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _currentLevel = 1;
  int _coins = 894;
  int _lives = 5;
  int _stars = 151;
  int _selectedTab = 2; // Ana Sayfa

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              Color(0xFF4FC3F7),
              Color(0xFF0288D1),
              Color(0xFF01579B),
            ],
          ),
        ),
        child: SafeArea(
          child: Column(
            children: [
              _buildTopBar(),
              _buildEnergyBar(),
              Expanded(child: _buildIslandView()),
              _buildLevelButton(),
              _buildBottomNav(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTopBar() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      child: Row(
        children: [
          // Profile
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: Colors.purple.shade300,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: Colors.white, width: 2),
            ),
            child: const Icon(Icons.person, color: Colors.white, size: 24),
          ),
          const SizedBox(width: 8),
          // Coins
          _buildResourceBadge(
            icon: Icons.monetization_on,
            value: '$_coins',
            color: Colors.amber,
          ),
          const SizedBox(width: 8),
          // Lives
          _buildResourceBadge(
            icon: Icons.favorite,
            value: '$_lives',
            color: Colors.red,
          ),
          const Spacer(),
          // Stars
          _buildResourceBadge(
            icon: Icons.star,
            value: '$_stars',
            color: Colors.yellow,
          ),
          const SizedBox(width: 8),
          // Settings
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: Colors.blue.shade700,
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.settings, color: Colors.white, size: 20),
          ),
        ],
      ),
    );
  }

  Widget _buildResourceBadge({
    required IconData icon,
    required String value,
    required Color color,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.black.withOpacity(0.3),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white24),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: color, size: 18),
          const SizedBox(width: 4),
          Text(
            value,
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.bold,
              fontSize: 13,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEnergyBar() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: Container(
        padding: const EdgeInsets.all(4),
        decoration: BoxDecoration(
          color: const Color(0xFF6B2FA0),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Row(
          children: [
            Container(
              width: 28,
              height: 28,
              decoration: const BoxDecoration(
                color: Colors.red,
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.flash_on, color: Colors.white, size: 16),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: ClipRRect(
                borderRadius: BorderRadius.circular(10),
                child: LinearProgressIndicator(
                  value: 71 / 80,
                  minHeight: 16,
                  backgroundColor: Colors.grey.shade800,
                  valueColor: const AlwaysStoppedAnimation<Color>(
                    Color(0xFF4CAF50),
                  ),
                ),
              ),
            ),
            const SizedBox(width: 8),
            const Text(
              '71/80',
              style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
                fontSize: 12,
              ),
            ),
            const SizedBox(width: 8),
            Container(
              width: 28,
              height: 28,
              decoration: BoxDecoration(
                color: Colors.purple.shade300,
                borderRadius: BorderRadius.circular(6),
              ),
              child: const Icon(Icons.card_giftcard, color: Colors.white, size: 16),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildIslandView() {
    return Stack(
      children: [
        // Island illustration
        Center(
          child: Container(
            width: 280,
            height: 280,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: RadialGradient(
                colors: [
                  Colors.green.shade300.withOpacity(0.3),
                  Colors.blue.shade200.withOpacity(0.1),
                ],
              ),
            ),
            child: Stack(
              alignment: Alignment.center,
              children: [
                // Island base
                Positioned(
                  bottom: 40,
                  child: Container(
                    width: 220,
                    height: 120,
                    decoration: BoxDecoration(
                      color: Colors.green.shade400,
                      borderRadius: BorderRadius.circular(60),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.2),
                          blurRadius: 20,
                          offset: const Offset(0, 10),
                        ),
                      ],
                    ),
                  ),
                ),
                // Lighthouse
                Positioned(
                  top: 30,
                  child: Column(
                    children: [
                      Container(
                        width: 8,
                        height: 40,
                        color: Colors.red.shade400,
                      ),
                      Container(
                        width: 30,
                        height: 60,
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(4),
                          border: Border.all(color: Colors.red, width: 2),
                        ),
                      ),
                    ],
                  ),
                ),
                // Palm trees
                Positioned(
                  left: 40,
                  top: 80,
                  child: Icon(
                    Icons.park,
                    color: Colors.green.shade700,
                    size: 40,
                  ),
                ),
                Positioned(
                  right: 50,
                  top: 100,
                  child: Icon(
                    Icons.park,
                    color: Colors.green.shade600,
                    size: 35,
                  ),
                ),
              ],
            ),
          ),
        ),
        // Side event buttons
        // Village button
        Positioned(
          left: 12,
          bottom: 20,
          child: GestureDetector(
            onTap: () {
              Navigator.push(context, MaterialPageRoute(builder: (_) => const VillageScreen()));
            },
            child: _buildEventButton('5g 00s', Icons.location_city, Colors.deepPurple),
          ),
        ),
        Positioned(
          left: 12,
          top: 20,
          child: _buildEventButton('1g 00s', Icons.inventory_2, Colors.orange),
        ),
        Positioned(
          left: 12,
          top: 80,
          child: _buildEventButton('3d 46s', Icons.emoji_nature, Colors.amber),
        ),
        Positioned(
          right: 12,
          top: 20,
          child: _buildEventButton('ADS', Icons.block, Colors.pink),
        ),
        Positioned(
          right: 12,
          top: 80,
          child: _buildEventButton('11g 00s', Icons.card_giftcard, Colors.red),
        ),
        Positioned(
          right: 12,
          bottom: 20,
          child: _buildEventButton('12g 00s', Icons.local_florist, Colors.orange),
        ),
      ],
    );
  }

  Widget _buildEventButton(String timer, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: color.withOpacity(0.4),
            blurRadius: 6,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: Colors.white, size: 16),
          const SizedBox(width: 4),
          Text(
            timer,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 10,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLevelButton() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 12),
      child: GestureDetector(
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (_) => GameScreen(levelNumber: _currentLevel),
            ),
          );
        },
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(vertical: 16),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFFFF8F00), Color(0xFFF57C00)],
            ),
            borderRadius: BorderRadius.circular(30),
            boxShadow: [
              BoxShadow(
                color: Colors.orange.withOpacity(0.5),
                blurRadius: 10,
                offset: const Offset(0, 5),
              ),
            ],
            border: Border.all(color: Colors.white24, width: 2),
          ),
          child: Text(
            'SEVİYE $_currentLevel',
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 22,
              fontWeight: FontWeight.bold,
              letterSpacing: 1.5,
              shadows: [
                Shadow(
                  color: Colors.black26,
                  blurRadius: 4,
                  offset: Offset(1, 2),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildBottomNav() {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 8),
      decoration: BoxDecoration(
        color: const Color(0xFF6B2FA0),
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: [
          _buildNavItem(0, Icons.store, 'MAĞAZA'),
          _buildNavItem(1, Icons.star, 'ETKİNLİK'),
          _buildNavItem(2, Icons.home, 'ANA SAYFA'),
          _buildNavItem(3, Icons.emoji_events, 'LİG'),
          _buildNavItem(4, Icons.card_giftcard, 'ÖDÜL'),
        ],
      ),
    );
  }

  Widget _buildNavItem(int index, IconData icon, String label) {
    final isSelected = _selectedTab == index;
    return GestureDetector(
      onTap: () {
        setState(() => _selectedTab = index);
        if (index == 0) {
          Navigator.push(context, MaterialPageRoute(builder: (_) => const ShopScreen()));
        } else if (index == 1) {
          Navigator.push(context, MaterialPageRoute(builder: (_) => const EventsScreen()));
        } else if (index == 4) {
          Navigator.push(context, MaterialPageRoute(builder: (_) => const RewardsScreen()));
        }
      },
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: isSelected ? Colors.white.withOpacity(0.2) : Colors.transparent,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(
              icon,
              color: isSelected ? Colors.white : Colors.white60,
              size: 24,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: TextStyle(
              color: isSelected ? Colors.white : Colors.white60,
              fontSize: 9,
              fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
            ),
          ),
        ],
      ),
    );
  }
}
