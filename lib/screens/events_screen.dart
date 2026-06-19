import 'package:flutter/material.dart';

class EventsScreen extends StatefulWidget {
  const EventsScreen({super.key});

  @override
  State<EventsScreen> createState() => _EventsScreenState();
}

class _EventsScreenState extends State<EventsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              Color(0xFF1A1A3E),
              Color(0xFF2D1B69),
            ],
          ),
        ),
        child: SafeArea(
          child: Column(
            children: [
              _buildHeader(),
              _buildTabs(),
              Expanded(
                child: TabBarView(
                  controller: _tabController,
                  children: [
                    _buildDailyQuests(),
                    _buildMatchingQuest(),
                    _buildMatchingPass(),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          IconButton(
            icon: const Icon(Icons.arrow_back, color: Colors.white),
            onPressed: () => Navigator.pop(context),
          ),
          const Expanded(
            child: Text(
              'ETKİNLİK',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: Colors.white,
                fontSize: 24,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          const SizedBox(width: 48),
        ],
      ),
    );
  }

  Widget _buildTabs() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.1),
        borderRadius: BorderRadius.circular(25),
      ),
      child: TabBar(
        controller: _tabController,
        indicator: BoxDecoration(
          color: const Color(0xFF6B2FA0),
          borderRadius: BorderRadius.circular(25),
        ),
        labelColor: Colors.white,
        unselectedLabelColor: Colors.white60,
        labelStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
        tabs: const [
          Tab(text: 'Günlük Görev'),
          Tab(text: 'Eşleştirme'),
          Tab(text: 'Pas'),
        ],
      ),
    );
  }

  Widget _buildDailyQuests() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _buildQuestTimer('10d 30s'),
        const SizedBox(height: 12),
        _buildProgressBar(4, 4),
        const SizedBox(height: 16),
        _buildDailyQuestItem(
          'Bugün giriş yap',
          '1/1',
          1.0,
          Icons.calendar_today,
          '10m Can',
          true,
        ),
        _buildDailyQuestItem(
          '10 Yıldız kazan',
          '10/10',
          1.0,
          Icons.star,
          'x2 Zar',
          true,
        ),
        _buildDailyQuestItem(
          'Zar 2 kez kullan',
          '2/2',
          1.0,
          Icons.casino,
          '+200 Altın',
          true,
        ),
        _buildDailyQuestItem(
          'Sayı Bombası 10 kez tetikle',
          '10/10',
          1.0,
          Icons.radio_button_checked,
          'x1 Büyü',
          true,
        ),
      ],
    );
  }

  Widget _buildMatchingQuest() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _buildQuestBanner('Eşleştirme Görevi'),
        const SizedBox(height: 12),
        _buildQuestTimer('2g 00s'),
        _buildProgressBar(71, 80),
        const SizedBox(height: 16),
        _buildMilestoneItem(10, Icons.card_giftcard, 'Hediye Kutusu', true),
        _buildMilestoneItem(9, Icons.monetization_on, '+900 Altın', true),
        _buildMilestoneItem(8, Icons.card_giftcard, 'Süper Kutu', false),
        _buildMilestoneItem(7, Icons.favorite, '15m Can', false),
      ],
    );
  }

  Widget _buildMatchingPass() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _buildPassHeader(),
        const SizedBox(height: 16),
        _buildPassItem(1, '15m Can', Icons.favorite, true, false),
        _buildPassItem(2, 'x1 Zar', Icons.casino, true, false),
        _buildPassItem(3, 'x1 Ay', Icons.nightlight_round, true, false),
        _buildPassItem(4, 'Hediye Kutusu', Icons.card_giftcard, false, true),
        _buildPassItem(5, '30m Can', Icons.favorite, false, true),
      ],
    );
  }

  Widget _buildQuestTimer(String time) {
    return Center(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: Colors.pink.shade400,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.timer, color: Colors.white, size: 16),
            const SizedBox(width: 6),
            Text(
              time,
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildProgressBar(int current, int max) {
    return Column(
      children: [
        ClipRRect(
          borderRadius: BorderRadius.circular(10),
          child: LinearProgressIndicator(
            value: current / max,
            minHeight: 20,
            backgroundColor: Colors.grey.shade800,
            valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFF4CAF50)),
          ),
        ),
        const SizedBox(height: 4),
        Text(
          '$current/$max',
          style: const TextStyle(color: Colors.white70, fontSize: 12),
        ),
      ],
    );
  }

  Widget _buildDailyQuestItem(
    String title,
    String progress,
    double progressValue,
    IconData icon,
    String reward,
    bool isCompleted,
  ) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(isCompleted ? 0.15 : 0.08),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isCompleted ? Colors.green.withOpacity(0.5) : Colors.white24,
        ),
      ),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: Colors.white, size: 24),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 4),
                ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: LinearProgressIndicator(
                    value: progressValue,
                    minHeight: 8,
                    backgroundColor: Colors.grey.shade800,
                    valueColor: const AlwaysStoppedAnimation<Color>(Colors.green),
                  ),
                ),
                Text(
                  progress,
                  style: const TextStyle(color: Colors.white60, fontSize: 11),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Column(
            children: [
              if (isCompleted)
                const Icon(Icons.check_circle, color: Colors.green, size: 28)
              else
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.green,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    reward,
                    style: const TextStyle(color: Colors.white, fontSize: 10),
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildQuestBanner(String title) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFFFFD700), Color(0xFFFFA000)],
        ),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Center(
        child: Text(
          title,
          style: const TextStyle(
            color: Color(0xFF4A148C),
            fontSize: 20,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
    );
  }

  Widget _buildMilestoneItem(int level, IconData icon, String reward, bool isUnlocked) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: isUnlocked ? Colors.amber.withOpacity(0.2) : Colors.white.withOpacity(0.05),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isUnlocked ? Colors.amber : Colors.white24,
        ),
      ),
      child: Row(
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: isUnlocked ? Colors.amber : Colors.grey,
              shape: BoxShape.circle,
            ),
            child: Center(
              child: Text(
                '$level',
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Icon(icon, color: isUnlocked ? Colors.amber : Colors.grey, size: 28),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              reward,
              style: TextStyle(
                color: isUnlocked ? Colors.white : Colors.white60,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          Icon(
            isUnlocked ? Icons.check_circle : Icons.lock,
            color: isUnlocked ? Colors.green : Colors.grey,
          ),
        ],
      ),
    );
  }

  Widget _buildPassHeader() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF6B2FA0), Color(0xFF9C27B0)],
        ),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        children: [
          const Text(
            'Eşleştirme Pas',
            style: TextStyle(
              color: Colors.white,
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('0/10', style: TextStyle(color: Colors.white70)),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(
                  color: Colors.green,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Text(
                  'Etkinleştir',
                  style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildPassItem(
    int tier,
    String reward,
    IconData icon,
    bool isFree,
    bool isLocked,
  ) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: isFree
            ? Colors.purple.withOpacity(0.2)
            : Colors.amber.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isFree ? Colors.purple : Colors.amber.withOpacity(0.5),
        ),
      ),
      child: Row(
        children: [
          Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              color: isFree ? Colors.green : Colors.amber,
              shape: BoxShape.circle,
            ),
            child: Center(
              child: Text(
                '$tier',
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 12,
                ),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Icon(icon, color: Colors.white, size: 24),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              reward,
              style: const TextStyle(color: Colors.white),
            ),
          ),
          if (isLocked) const Icon(Icons.lock, color: Colors.amber, size: 20),
          if (!isLocked && isFree)
            const Icon(Icons.check_circle, color: Colors.green, size: 20),
        ],
      ),
    );
  }
}
