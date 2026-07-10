<template>
  <div class="difficulty-analysis">
    <!-- Header -->
    <div class="analysis-header">
      <div class="header-left">
        <van-icon name="arrow-left" class="back-btn" id="btn-back" @click="$router.back()" />
        <h1 class="page-title">偷菜难易度分析</h1>
      </div>
      <div class="header-right">
        <span class="record-badge" id="badge-total-records">共 {{ totalRecords }} 条记录</span>
      </div>
    </div>

    <!-- Main Content -->
    <div class="analysis-content">
      <!-- 1. Overview Cards -->
      <section class="overview-grid">
        <div class="overview-card glass" id="card-success-rate">
          <div class="card-title">整体成功率</div>
          <div class="gauge-wrapper">
            <svg class="gauge-svg" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" class="gauge-track" />
              <circle
                cx="50"
                cy="50"
                r="42"
                class="gauge-fill"
                :style="{
                  strokeDashoffset: 263.89 * (1 - overallSuccessRate / 100),
                  stroke: getRateColor(overallSuccessRate)
                }"
              />
              <text x="50" y="55" class="gauge-text">{{ overallSuccessRate.toFixed(0) }}%</text>
            </svg>
          </div>
          <div class="card-footer-info">
            已成功 <span>{{ displaySuccessCount }}</span> 次 / 失败 <span>{{ displayFailCount }}</span> 次
          </div>
        </div>

        <div class="overview-stats-column">
          <div class="stat-mini-card glass" id="card-stat-users">
            <div class="stat-icon-wrapper user-icon">
              <van-icon name="friends-o" />
            </div>
            <div class="stat-info">
              <span class="stat-label">分析用户数</span>
              <span class="stat-value">{{ analyzedUsers.length }} 人</span>
            </div>
          </div>

          <div class="stat-mini-card glass" id="card-stat-easiest">
            <div class="stat-icon-wrapper easy-icon">
              <van-icon name="like-o" />
            </div>
            <div class="stat-info">
              <span class="stat-label">最易偷取</span>
              <span class="stat-value text-ellipsis" :title="easiestUser ? easiestUser.name : '无'">
                {{ easiestUser ? easiestUser.name : '暂无' }}
              </span>
            </div>
          </div>

          <div class="stat-mini-card glass" id="card-stat-hardest">
            <div class="stat-icon-wrapper hard-icon">
              <van-icon name="warning-o" />
            </div>
            <div class="stat-info">
              <span class="stat-label">防守最严</span>
              <span class="stat-value text-ellipsis" :title="hardestUser ? hardestUser.name : '无'">
                {{ hardestUser ? hardestUser.name : '暂无' }}
              </span>
            </div>
          </div>
        </div>
      </section>

      <!-- 2. Charts Section -->
      <section class="charts-section">
        <!-- Donut Chart: Difficulty Distribution -->
        <div class="chart-card glass" id="card-difficulty-donut">
          <h2 class="section-title">难度分布比例</h2>
          <div class="donut-chart-container">
            <div class="donut-chart-wrapper">
              <svg class="donut-svg" viewBox="0 0 100 100">
                <circle
                  v-for="(seg, idx) in donutSegments"
                  :key="idx"
                  cx="50"
                  cy="50"
                  r="35"
                  fill="none"
                  :stroke="seg.color"
                  stroke-width="12"
                  :stroke-dasharray="`${seg.length} 219.91`"
                  :stroke-dashoffset="-seg.offset"
                  class="donut-segment"
                  transform="rotate(-90 50 50)"
                />
                <circle cx="50" cy="50" r="28" fill="#ffffff" />
              </svg>
              <div class="donut-center-label">
                <span class="num">{{ analyzedUsers.length }}</span>
                <span class="label">分析对象</span>
              </div>
            </div>
            
            <div class="donut-legend">
              <div
                v-for="item in difficultyStatsList"
                :key="item.key"
                class="legend-item"
                @click="filterDifficulty(item.key)"
                :class="{ active: currentDifficultyFilter === item.key }"
              >
                <span class="legend-color-dot" :style="{ backgroundColor: item.color }"></span>
                <span class="legend-name">{{ item.name }}</span>
                <span class="legend-count">{{ item.count }}人</span>
                <span class="legend-pct">({{ item.percentage }}%)</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Calendar: Daily Success Rate -->
        <div class="chart-card glass" id="card-success-calendar">
          <div class="calendar-header-wrapper">
            <h2 class="section-title"></h2>
            <div class="calendar-nav">
              <van-icon name="arrow-left" class="nav-arrow" @click="prevMonth" />
              <span class="current-month-label">{{ currentYear }}年{{ String(currentMonth + 1).padStart(2, '0') }}月</span>
              <span class="nav-arrow-right-wrapper">
                <van-icon name="arrow" class="nav-arrow" @click="nextMonth" />
              </span>
            </div>
          </div>
          
          <div class="calendar-grid-container">
            <!-- Week headers -->
            <div class="calendar-week-headers">
              <span v-for="w in ['日', '一', '二', '三', '四', '五', '六']" :key="w" class="week-header">{{ w }}</span>
            </div>
            
            <!-- Days grid -->
            <div class="calendar-days-grid">
              <div
                v-for="(day, idx) in calendarDays"
                :key="idx"
                class="calendar-day-cell"
                :class="{
                  'empty-cell': !day.dayNum,
                  'has-records': day.dateString && dailyStatsMap[day.dateString],
                  'active-selected': day.dateString && selectedDate === day.dateString,
                  'success-day': day.dateString && isSuccessDay(day.dateString),
                  'fail-day': day.dateString && isFailDay(day.dateString),
                  'neutral-day': day.dateString && isNeutralDay(day.dateString)
                }"
                @click="selectCalendarDate(day.dateString)"
              >
                <template v-if="day.dayNum">
                  <span class="day-number">{{ day.dayNum }}</span>
                  <span
                    v-if="dailyStatsMap[day.dateString]"
                    class="day-record-count-badge"
                  >
                    {{ dailyStatsMap[day.dateString].total }}条
                  </span>
                </template>
              </div>
            </div>
          </div>
          
          <!-- Selected Day Details Panel -->
          <div v-if="selectedDate" class="selected-day-details animate-fade-in">
            <div class="details-header">
              <span class="details-title">📅 {{ selectedDate }} 详情</span>
              <span class="close-details-btn" @click="selectedDate = null">收起</span>
            </div>
            
            <div v-if="dailyStatsMap[selectedDate]" class="details-stats-summary">
              <span class="stat-pill green">成功: {{ dailyStatsMap[selectedDate].success }}次</span>
              <span class="stat-pill orange">失败: {{ dailyStatsMap[selectedDate].fail }}次</span>
              <span class="stat-pill gray">不明: {{ dailyStatsMap[selectedDate].unmarked }}次</span>
              <span class="stat-pill total">共: {{ dailyStatsMap[selectedDate].total }}条</span>
              <span class="stat-pill rate" v-if="dailyStatsMap[selectedDate].success + dailyStatsMap[selectedDate].fail > 0">
                成功率: {{ (dailyStatsMap[selectedDate].success / (dailyStatsMap[selectedDate].success + dailyStatsMap[selectedDate].fail) * 100).toFixed(0) }}%
              </span>
            </div>
            
            <div v-if="dailyStatsMap[selectedDate]" class="details-records-list">
              <div
                v-for="(rec, idx) in dailyStatsMap[selectedDate].records"
                :key="idx"
                class="detail-record-row"
              >
                <div class="rec-user-info">
                  <span class="dot-status" :class="rec.status || 'gray'"></span>
                  <span class="user-name">{{ rec.name }}</span>
                </div>
                <div class="rec-meta">
                  <span class="rec-time">{{ rec.time || '未设置时间' }}</span>
                  <span class="rec-source" :class="rec.source">{{ rec.source === 'active' ? '活跃' : '已删除' }}</span>
                </div>
              </div>
            </div>
             <div v-else class="details-records-empty">该日无记录</div>
          </div>
        </div>

        <!-- Chart: Daily Trend Line Chart -->
        <div class="chart-card glass" id="card-trend-line-chart">
          <div class="calendar-header-wrapper">
            <h2 class="section-title">趋势数据分析</h2>
            <div class="calendar-nav">
              <van-icon name="arrow-left" class="nav-arrow" @click="prevMonth" />
              <span class="current-month-label">{{ currentYear }}年{{ String(currentMonth + 1).padStart(2, '0') }}月</span>
              <span class="nav-arrow-right-wrapper">
                <van-icon name="arrow" class="nav-arrow" @click="nextMonth" />
              </span>
            </div>
          </div>

          <div class="chart-toggles">
            <span
              class="chart-toggle-btn"
              :class="{ active: chartMode === 'rate' }"
              @click="chartMode = 'rate'"
            >
              成功率趋势
            </span>
            <span
              class="chart-toggle-btn"
              :class="{ active: chartMode === 'count' }"
              @click="chartMode = 'count'"
            >
              记录数趋势
            </span>
          </div>

          <!-- SVG Chart Area -->
          <div class="svg-chart-container">
            <svg
              class="trend-line-svg"
              viewBox="0 0 500 220"
              ref="chartSvg"
              @mousemove="handleSvgMouseMove"
              @mouseleave="handleSvgMouseLeave"
            >
              <!-- Gradients definitions -->
              <defs>
                <linearGradient id="rateLineGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#10b981" />
                  <stop offset="100%" stop-color="#3b82f6" />
                </linearGradient>
                <linearGradient id="rateAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#10b981" stop-opacity="0.3" />
                  <stop offset="100%" stop-color="#3b82f6" stop-opacity="0.0" />
                </linearGradient>
                <linearGradient id="countLineGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#8b5cf6" />
                  <stop offset="100%" stop-color="#ec4899" />
                </linearGradient>
                <linearGradient id="countAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#8b5cf6" stop-opacity="0.3" />
                  <stop offset="100%" stop-color="#ec4899" stop-opacity="0.0" />
                </linearGradient>
              </defs>

              <!-- Grid Y-Lines and Labels -->
              <g class="grid-lines-group">
                <line
                  v-for="(grid, idx) in yGridLines"
                  :key="idx"
                  x1="40"
                  :y1="grid.y"
                  x2="480"
                  :y2="grid.y"
                  stroke="#e2e8f0"
                  stroke-dasharray="3 3"
                />
                <text
                  v-for="(grid, idx) in yGridLines"
                  :key="'lbl-' + idx"
                  x="32"
                  :y="grid.y + 4"
                  text-anchor="end"
                  class="chart-grid-label"
                >
                  {{ grid.label }}
                </text>
              </g>

              <!-- X-Axis Line -->
              <line x1="40" y1="190" x2="480" y2="190" stroke="#cbd5e1" stroke-width="1" />

              <!-- X-Axis Labels (every 5 days) -->
              <g class="x-labels-group">
                <text
                  v-for="dayNum in xAxisDays"
                  :key="dayNum"
                  :x="getXCoordinate(dayNum)"
                  y="206"
                  text-anchor="middle"
                  class="chart-grid-label"
                >
                  {{ dayNum }}日
                </text>
              </g>

              <!-- Chart Area Paths -->
              <g v-if="chartPoints.length > 0">
                <!-- Area Path -->
                <path
                  :d="chartAreaPath"
                  :fill="chartMode === 'rate' ? 'url(#rateAreaGrad)' : 'url(#countAreaGrad)'"
                />
                <!-- Line Path -->
                <path
                  :d="chartLinePath"
                  fill="none"
                  :stroke="chartMode === 'rate' ? 'url(#rateLineGrad)' : 'url(#countLineGrad)'"
                  stroke-width="3"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </g>

              <!-- Guide Line -->
              <line
                v-if="hoveredPoint"
                :x1="hoveredPoint.x"
                y1="20"
                :x2="hoveredPoint.x"
                y2="190"
                stroke="#cbd5e1"
                stroke-width="1.5"
                stroke-dasharray="4 4"
                pointer-events="none"
              />

              <!-- Highlight Dot -->
              <circle
                v-if="hoveredPoint"
                :cx="hoveredPoint.x"
                :cy="hoveredPoint.y"
                r="7"
                :fill="chartMode === 'rate' ? '#10b981' : '#8b5cf6'"
                stroke="#ffffff"
                stroke-width="2.5"
                pointer-events="none"
              />

              <!-- Interactive Points -->
              <g class="chart-points-group" style="pointer-events: none;">
                <circle
                  v-for="(pt, idx) in chartPoints"
                  :key="idx"
                  :cx="pt.x"
                  :cy="pt.y"
                  r="4"
                  :fill="chartMode === 'rate' ? '#10b981' : '#8b5cf6'"
                  stroke="#ffffff"
                  stroke-width="1.5"
                />
              </g>
            </svg>
            
            <!-- Floating Tooltip -->
            <div
              v-if="tooltip.show"
              class="chart-tooltip-box animate-fade-in"
              :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }"
            >
              <div class="tooltip-date">{{ tooltip.date }}</div>
              <div class="tooltip-val">{{ tooltip.valueText }}</div>
            </div>
            
            <div v-if="chartPoints.length === 0" class="chart-empty-state">
              <span>本月无可用趋势数据</span>
            </div>
          </div>
        </div>
      </section>

      <!-- 3. Search and User List -->
      <section class="user-list-section glass" id="card-users-list">
        <div class="list-controls">
          <div class="search-box">
            <van-icon name="search" class="search-icon" />
            <input
              v-model="searchQuery"
              type="text"
              class="search-input"
              id="input-user-search"
              placeholder="搜索用户名..."
            />
            <van-icon
              v-if="searchQuery"
              name="clear"
              class="clear-icon"
              @click="searchQuery = ''"
            />
          </div>
          
          <div class="filter-tabs">
            <span
              class="filter-tab"
              :class="{ active: currentDifficultyFilter === 'all' }"
              @click="currentDifficultyFilter = 'all'"
            >
              全部
            </span>
            <span
              class="filter-tab easy"
              :class="{ active: currentDifficultyFilter === 'easy' }"
              @click="currentDifficultyFilter = 'easy'"
            >
              容易
            </span>
            <span
              class="filter-tab hard"
              :class="{ active: currentDifficultyFilter === 'hard' }"
              @click="currentDifficultyFilter = 'hard'"
            >
              困难
            </span>
            <span
              class="filter-tab unknown"
              :class="{ active: currentDifficultyFilter === 'unknown' }"
              @click="currentDifficultyFilter = 'unknown'"
            >
              不明
            </span>
          </div>
        </div>

        <div class="user-list-wrapper">
          <van-empty v-if="filteredUsers.length === 0" description="未找到匹配的用户分析" />

          <div v-else class="user-cards-list">
            <div
              v-for="user in filteredUsers"
              :key="user.name"
              class="user-analysis-card"
              :class="user.difficulty"
              @click="toggleUserExpand(user.name)"
            >
              <div class="user-card-summary">
                <div class="user-main-info">
                  <div class="user-avatar" :style="{ background: getDifficultyGradient(user.difficulty) }">
                    {{ user.name.charAt(0) }}
                  </div>
                  <div class="user-title-box">
                    <div class="user-name-wrapper">
                      <span class="user-name">{{ user.name }}</span>
                      <span class="copy-badge" @click.stop="copyUserName(user.name)">
                        <van-icon name="copy-o" /> 复制
                      </span>
                    </div>
                    <div class="user-record-summary-text">
                      记录 {{ user.total }} 次 (成功 {{ user.success }} / 失败 {{ user.fail }})
                    </div>
                  </div>
                </div>

                <div class="user-badge-info">
                  <span class="difficulty-badge" :class="user.difficulty">
                    {{ user.difficultyText }}
                  </span>
                  <span class="success-rate-text" v-if="user.difficulty !== 'unknown'">
                    {{ user.successRate.toFixed(0) }}% 成功率
                  </span>
                </div>
              </div>

              <!-- Expanded Details -->
              <div
                v-if="expandedUsers.includes(user.name)"
                class="user-card-details animate-expand"
                @click.stop
              >
                <div class="details-divider"></div>
                <div class="details-grid">
                  <div class="detail-item">
                    <span class="detail-label">成功率详情</span>
                    <div class="detail-progress-bar">
                      <div class="progress-bg">
                        <div
                          class="progress-fill"
                          :style="{
                            width: user.successRate + '%',
                            background: getDifficultyColor(user.difficulty)
                          }"
                        ></div>
                      </div>
                      <span class="progress-text">{{ user.successRate.toFixed(1) }}%</span>
                    </div>
                  </div>

                  <div class="detail-item">
                    <span class="detail-label">高频成熟时段</span>
                    <span class="detail-value text-highlight">
                      <van-icon name="clock-o" /> {{ user.favoriteHourText }}
                    </span>
                  </div>

                  <div class="detail-item">
                    <span class="detail-label">历史状态分布</span>
                    <div class="status-distribution">
                      <span class="status-pill green">成功: {{ user.success }}次</span>
                      <span class="status-pill orange">失败: {{ user.fail }}次</span>
                      <span class="status-pill gray" v-if="user.unmarked > 0">未标注: {{ user.unmarked }}次</span>
                    </div>
                  </div>

                  <div class="detail-item">
                    <span class="detail-label">数据来源占比</span>
                    <span class="detail-value text-muted">
                      活跃记录: {{ user.sources.filter(s => s === 'active').length }} / 
                      回收站历史: {{ user.sources.filter(s => s === 'deleted').length }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script>
import { Icon, Empty, Toast } from 'vant';

const STORAGE_KEY = 'maturity_tracking_data';

export default {
  name: 'DifficultyAnalysis',
  components: {
    [Icon.name]: Icon,
    [Empty.name]: Empty,
    [Toast.name]: Toast
  },
  data() {
    return {
      tableData: [],
      deletedData: [],
      stolenMap: {},
      analyzedUsers: [],
      searchQuery: '',
      currentDifficultyFilter: 'all',
      expandedUsers: [],
      totalRecords: 0,
      totalSuccessCount: 0,
      totalFailCount: 0,
      currentYear: new Date().getFullYear(),
      currentMonth: new Date().getMonth(),
      selectedDate: null,
      chartMode: 'rate',
      hoveredPoint: null,
      tooltip: {
        show: false,
        x: 0,
        y: 0,
        date: '',
        valueText: ''
      }
    };
  },
  computed: {
    displaySuccessCount() {
      const validUsers = this.analyzedUsers.filter(u => u.difficulty !== 'unknown');
      return validUsers.reduce((sum, u) => sum + u.success, 0);
    },
    displayFailCount() {
      const validUsers = this.analyzedUsers.filter(u => u.difficulty !== 'unknown');
      return validUsers.reduce((sum, u) => sum + u.fail, 0);
    },
    overallSuccessRate() {
      const total = this.displaySuccessCount + this.displayFailCount;
      return total > 0 ? (this.displaySuccessCount / total) * 100 : 0;
    },
    easiestUser() {
      const candidates = this.analyzedUsers.filter(u => u.difficulty === 'easy');
      if (candidates.length === 0) return null;
      return candidates.reduce((prev, current) => {
        if (current.successRate > prev.successRate) return current;
        if (current.successRate === prev.successRate && current.success > prev.success) return current;
        return prev;
      }, candidates[0]);
    },
    hardestUser() {
      const candidates = this.analyzedUsers.filter(u => u.difficulty === 'hard');
      if (candidates.length === 0) return null;
      return candidates.reduce((prev, current) => {
        if (current.successRate < prev.successRate) return current;
        if (current.successRate === prev.successRate && current.fail > prev.fail) return current;
        return prev;
      }, candidates[0]);
    },

    difficultyStats() {
      const stats = {
        easy: 0,
        hard: 0,
        unknown: 0
      };
      this.analyzedUsers.forEach(u => {
        stats[u.difficulty]++;
      });
      return stats;
    },
    difficultyStatsList() {
      const total = this.analyzedUsers.length || 1;
      const stats = this.difficultyStats;
      return [
        { key: 'easy', name: '容易', count: stats.easy, percentage: ((stats.easy / total) * 100).toFixed(0), color: '#10b981' },
        { key: 'hard', name: '困难', count: stats.hard, percentage: ((stats.hard / total) * 100).toFixed(0), color: '#f43f5e' },
        { key: 'unknown', name: '不明', count: stats.unknown, percentage: ((stats.unknown / total) * 100).toFixed(0), color: '#9ca3af' }
      ];
    },
    donutSegments() {
      const total = this.analyzedUsers.length;
      if (total === 0) {
        return [{ color: '#e5e7eb', length: 219.91, offset: 0 }]; // Empty state gray ring
      }
      
      const stats = this.difficultyStats;
      const ringCircumference = 219.91; // 2 * pi * r (r=35)
      
      const segments = [
        { key: 'easy', count: stats.easy, color: '#10b981' },
        { key: 'hard', count: stats.hard, color: '#f43f5e' },
        { key: 'unknown', count: stats.unknown, color: '#9ca3af' }
      ];

      let currentOffset = 0;
      return segments
        .filter(seg => seg.count > 0)
        .map(seg => {
          const length = (seg.count / total) * ringCircumference;
          const segmentData = {
            color: seg.color,
            length,
            offset: currentOffset
          };
          currentOffset += length;
          return segmentData;
        });
    },
    filteredUsers() {
      let result = this.analyzedUsers;

      // Filter by search query
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase();
        result = result.filter(u => u.name.toLowerCase().includes(query));
      }

      // Filter by difficulty tab
      if (this.currentDifficultyFilter !== 'all') {
        result = result.filter(u => u.difficulty === this.currentDifficultyFilter);
      }

      // Sort by record count, then by success rate desc
      return [...result].sort((a, b) => {
        if (b.total !== a.total) {
          return b.total - a.total;
        }
        return b.successRate - a.successRate;
      });
    },
    calendarDays() {
      const year = this.currentYear;
      const month = this.currentMonth;
      const firstDay = new Date(year, month, 1);
      const startDayOfWeek = firstDay.getDay(); // 0 is Sunday, 6 is Saturday
      const totalDays = new Date(year, month + 1, 0).getDate();
      const days = [];
      for (let i = 0; i < startDayOfWeek; i++) {
        days.push({ dayNum: null, dateString: null });
      }
      for (let day = 1; day <= totalDays; day++) {
        const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        days.push({
          dayNum: day,
          dateString
        });
      }
      return days;
    },
    dailyStatsMap() {
      const stats = {};
      const process = (row, status, date) => {
        if (!date) return;
        if (!stats[date]) {
          stats[date] = {
            success: 0,
            fail: 0,
            unmarked: 0,
            total: 0,
            records: []
          };
        }
        const dayStat = stats[date];
        dayStat.total++;
        if (status === 'green') {
          dayStat.success++;
        } else if (status === 'orange') {
          dayStat.fail++;
        } else {
          dayStat.unmarked++;
        }
        dayStat.records.push({
          name: row.name || '未命名',
          time: row.maturityTime,
          status,
          source: row.deletedAt ? 'deleted' : 'active'
        });
      };

      const todayStr = this.getLocalDateString(new Date());
      this.tableData.forEach(row => {
        const status = this.stolenMap[row.id] || '';
        process(row, status, todayStr);
      });

      this.deletedData.forEach(row => {
        const status = row.stolenStatus || this.stolenMap[row.id] || '';
        if (row.deletedAt) {
          const dateStr = this.getLocalDateString(row.deletedAt);
          process(row, status, dateStr);
        }
      });

      return stats;
    },
    yGridLines() {
      if (this.chartMode === 'rate') {
        return [
          { label: '100%', y: 20 },
          { label: '75%', y: 20 + 170 * 0.25 },
          { label: '50%', y: 20 + 170 * 0.5 },
          { label: '25%', y: 20 + 170 * 0.75 },
          { label: '0%', y: 190 }
        ];
      } else {
        let maxVal = Math.max(...this.calendarDays.map(day => {
          if (!day.dateString) return 0;
          return this.dailyStatsMap[day.dateString] ? this.dailyStatsMap[day.dateString].total : 0;
        }), 4);
        maxVal = Math.ceil(maxVal / 4) * 4;
        return [
          { label: `${maxVal}条`, y: 20 },
          { label: `${maxVal * 0.75}条`, y: 20 + 170 * 0.25 },
          { label: `${maxVal * 0.5}条`, y: 20 + 170 * 0.5 },
          { label: `${maxVal * 0.25}条`, y: 20 + 170 * 0.75 },
          { label: '0条', y: 190 }
        ];
      }
    },
    xAxisDays() {
      const year = this.currentYear;
      const month = this.currentMonth;
      const totalDays = new Date(year, month + 1, 0).getDate();
      const result = [1, 5, 10, 15, 20, 25];
      if (totalDays >= 30) {
        result.push(30);
      } else {
        result.push(totalDays);
      }
      return result;
    },
    chartPoints() {
      const year = this.currentYear;
      const month = this.currentMonth;
      const totalDays = new Date(year, month + 1, 0).getDate();
      const paddingLeft = 40;
      const chartWidth = 440;
      const paddingTop = 20;
      const chartHeight = 170;
      const points = [];
      
      if (this.chartMode === 'rate') {
        for (let d = 1; d <= totalDays; d++) {
          const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          const dayStat = this.dailyStatsMap[dateString];
          if (dayStat && (dayStat.success + dayStat.fail) > 0) {
            const rate = (dayStat.success / (dayStat.success + dayStat.fail)) * 100;
            const x = paddingLeft + (d - 1) * (chartWidth / (totalDays - 1));
            const y = paddingTop + chartHeight - (rate / 100) * chartHeight;
            points.push({
              x,
              y,
              day: d,
              value: rate,
              dateString,
              success: dayStat.success,
              fail: dayStat.fail,
              total: dayStat.total
            });
          }
        }
      } else {
        let maxVal = Math.max(...this.calendarDays.map(day => {
          if (!day.dateString) return 0;
          return this.dailyStatsMap[day.dateString] ? this.dailyStatsMap[day.dateString].total : 0;
        }), 4);
        maxVal = Math.ceil(maxVal / 4) * 4;

        for (let d = 1; d <= totalDays; d++) {
          const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          const dayStat = this.dailyStatsMap[dateString];
          const count = dayStat ? dayStat.total : 0;
          const x = paddingLeft + (d - 1) * (chartWidth / (totalDays - 1));
          const y = paddingTop + chartHeight - (count / maxVal) * chartHeight;
          points.push({
            x,
            y,
            day: d,
            value: count,
            dateString,
            total: count,
            success: dayStat ? dayStat.success : 0,
            fail: dayStat ? dayStat.fail : 0
          });
        }
      }
      return points;
    },
    chartLinePath() {
      if (this.chartPoints.length === 0) return '';
      return this.chartPoints.map((pt, idx) => `${idx === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`).join(' ');
    },
    chartAreaPath() {
      if (this.chartPoints.length === 0) return '';
      const first = this.chartPoints[0];
      const last = this.chartPoints[this.chartPoints.length - 1];
      const linePart = this.chartPoints.map(pt => `L ${pt.x} ${pt.y}`).join(' ');
      return `M ${first.x} 190 ${linePart} L ${last.x} 190 Z`;
    }
  },
  created() {
    this.loadAndAnalyzeData();
  },
  methods: {
    loadAndAnalyzeData() {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          this.tableData = parsed.tableData || [];
          this.deletedData = parsed.deletedData || [];
          this.stolenMap = parsed.stolenMap || {};
        }
        this.runAnalysis();
      } catch (e) {
        console.error('加载分析数据失败:', e);
        this.$toast.fail('分析数据加载失败');
      }
    },
    runAnalysis() {
      const userMap = {};
      this.totalRecords = this.tableData.length + this.deletedData.length;
      
      let successCount = 0;
      let failCount = 0;

      const addRecord = (name, status, time, source) => {
        if (!name) return;
        const cleanName = name.trim();
        if (!cleanName) return;

        if (!userMap[cleanName]) {
          userMap[cleanName] = {
            name: cleanName,
            total: 0,
            success: 0,
            fail: 0,
            unmarked: 0,
            times: [],
            sources: []
          };
        }

        const user = userMap[cleanName];
        user.total++;
        user.sources.push(source);
        if (time) user.times.push(time);

        if (status === 'green') {
          user.success++;
          successCount++;
        } else if (status === 'orange') {
          user.fail++;
          failCount++;
        } else {
          user.unmarked++;
        }
      };

      // Active records
      this.tableData.forEach(row => {
        const status = this.stolenMap[row.id] || '';
        addRecord(row.name, status, row.maturityTime, 'active');
      });

      // Deleted records
      this.deletedData.forEach(row => {
        const status = row.stolenStatus || this.stolenMap[row.id] || '';
        addRecord(row.name, status, row.maturityTime, 'deleted');
      });

      this.totalSuccessCount = successCount;
      this.totalFailCount = failCount;

      // Transform map to detailed objects list
      this.analyzedUsers = Object.values(userMap).map(user => {
        const scoredAttempts = user.success + user.fail;
        const successRate = scoredAttempts > 0 ? (user.success / scoredAttempts) * 100 : 0;
        
        let difficulty = 'unknown';
        let difficultyText = '不明';
        
        if (user.success > user.fail) {
          difficulty = 'easy';
          difficultyText = '容易';
        } else if (user.fail > user.success) {
          difficulty = 'hard';
          difficultyText = '困难';
        } else {
          difficulty = 'unknown';
          difficultyText = '不明';
        }

        // Calculate favorite maturity window
        let favoriteHourText = '暂无时间数据';
        if (user.times.length > 0) {
          const hourCounts = {};
          user.times.forEach(t => {
            const parts = t.split(':');
            if (parts.length > 0) {
              const hr = parseInt(parts[0], 10);
              if (!isNaN(hr)) {
                hourCounts[hr] = (hourCounts[hr] || 0) + 1;
              }
            }
          });
          let maxCount = 0;
          let bestHr = null;
          for (const [hr, count] of Object.entries(hourCounts)) {
            if (count > maxCount) {
              maxCount = count;
              bestHr = parseInt(hr, 10);
            }
          }
          if (bestHr !== null) {
            const startHour = String(bestHr).padStart(2, '0');
            const endHour = String((bestHr + 1) % 24).padStart(2, '0');
            favoriteHourText = `${startHour}:00 - ${endHour}:00`;
          }
        }

        return {
          ...user,
          scoredAttempts,
          successRate,
          difficulty,
          difficultyText,
          favoriteHourText
        };
      });
    },
    filterDifficulty(key) {
      if (this.currentDifficultyFilter === key) {
        this.currentDifficultyFilter = 'all';
      } else {
        this.currentDifficultyFilter = key;
      }
    },
    toggleUserExpand(name) {
      const idx = this.expandedUsers.indexOf(name);
      if (idx > -1) {
        this.expandedUsers.splice(idx, 1);
      } else {
        this.expandedUsers.push(name);
      }
    },

    getRateColor(rate) {
      if (rate >= 75) return '#10b981'; // Easy (green)
      if (rate >= 40) return '#f59e0b'; // Medium (orange)
      return '#f43f5e'; // Hard (red)
    },
    getDifficultyColor(difficulty) {
      if (difficulty === 'easy') return '#10b981';
      if (difficulty === 'hard') return '#f43f5e';
      return '#9ca3af';
    },
    getDifficultyGradient(difficulty) {
      if (difficulty === 'easy') return 'linear-gradient(135deg, #34d399 0%, #10b981 100%)';
      if (difficulty === 'hard') return 'linear-gradient(135deg, #f87171 0%, #f43f5e 100%)';
      return 'linear-gradient(135deg, #d1d5db 0%, #9ca3af 100%)';
    },
    copyUserName(name) {
      if (!name) return;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(name).then(() => {
          this.$toast.success('已复制');
        }).catch(() => {
          this.fallbackCopy(name);
        });
      } else {
        this.fallbackCopy(name);
      }
    },
    fallbackCopy(text) {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        this.$toast.success('已复制');
      } catch (e) {
        this.$toast.fail('复制失败');
      }
      document.body.removeChild(textarea);
    },
    prevMonth() {
      if (this.currentMonth === 0) {
        this.currentMonth = 11;
        this.currentYear--;
      } else {
        this.currentMonth--;
      }
      this.selectedDate = null;
    },
    nextMonth() {
      if (this.currentMonth === 11) {
        this.currentMonth = 0;
        this.currentYear++;
      } else {
        this.currentMonth++;
      }
      this.selectedDate = null;
    },
    selectCalendarDate(dateString) {
      if (!dateString) return;
      this.selectedDate = this.selectedDate === dateString ? null : dateString;
    },
    getLocalDateString(isoStringOrDate) {
      const d = new Date(isoStringOrDate);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    },
    isSuccessDay(dateString) {
      const dayStat = this.dailyStatsMap[dateString];
      if (!dayStat) return false;
      return dayStat.success > dayStat.fail;
    },
    isFailDay(dateString) {
      const dayStat = this.dailyStatsMap[dateString];
      if (!dayStat) return false;
      return dayStat.fail > dayStat.success;
    },
    isNeutralDay(dateString) {
      const dayStat = this.dailyStatsMap[dateString];
      if (!dayStat) return false;
      return dayStat.success === dayStat.fail || (dayStat.success === 0 && dayStat.fail === 0);
    },
    handleSvgMouseMove(event) {
      if (this.chartPoints.length === 0) return;
      const svg = this.$refs.chartSvg;
      if (!svg) return;

      const rect = svg.getBoundingClientRect();
      const clientX = event.clientX - rect.left;
      const svgX = (clientX / rect.width) * 500;
      
      let minDistance = Infinity;
      let nearestPt = null;
      for (const pt of this.chartPoints) {
        const dist = Math.abs(pt.x - svgX);
        if (dist < minDistance) {
          minDistance = dist;
          nearestPt = pt;
        }
      }
      
      if (nearestPt) {
        this.hoveredPoint = nearestPt;
        
        const containerRect = svg.parentElement.getBoundingClientRect();
        const containerWidth = containerRect.width;
        const containerHeight = containerRect.height;
        
        const tooltipX = (nearestPt.x / 500) * containerWidth - 50;
        const tooltipY = (nearestPt.y / 220) * containerHeight - 60;
        
        this.tooltip = {
          show: true,
          x: tooltipX,
          y: tooltipY,
          date: nearestPt.dateString,
          valueText: this.chartMode === 'rate'
            ? `成功率: ${nearestPt.value.toFixed(0)}% (成功 ${nearestPt.success} / 失败 ${nearestPt.fail})`
            : `记录总数: ${nearestPt.value}条 (成功 ${nearestPt.success} / 失败 ${nearestPt.fail})`
        };
      }
    },
    handleSvgMouseLeave() {
      this.hoveredPoint = null;
      this.tooltip.show = false;
    },
    getXCoordinate(dayNum) {
      const year = this.currentYear;
      const month = this.currentMonth;
      const totalDays = new Date(year, month + 1, 0).getDate();
      const paddingLeft = 40;
      const chartWidth = 440;
      return paddingLeft + (dayNum - 1) * (chartWidth / (totalDays - 1));
    }
  }
};
</script>

<style lang="less" scoped>
.difficulty-analysis {
  min-height: 100vh;
  background: linear-gradient(180deg, #f1f5f9 0%, #e2e8f0 100%);
  padding-bottom: 30px;
  color: #1e293b;
}

.analysis-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #ffffff;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
  position: sticky;
  top: 0;
  z-index: 100;

  .header-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .back-btn {
    font-size: 22px;
    color: #475569;
    cursor: pointer;
    padding: 4px;
    border-radius: 50%;
    transition: background-color 0.2s;

    &:active {
      background-color: #f1f5f9;
    }
  }

  .page-title {
    margin: 0;
    font-size: 18px;
    font-weight: 700;
    letter-spacing: -0.025em;
    color: #0f172a;
  }

  .record-badge {
    font-size: 12px;
    background-color: #f1f5f9;
    color: #64748b;
    padding: 4px 10px;
    border-radius: 12px;
    font-weight: 500;
  }
}

.analysis-content {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Glassmorphism base styling */
.glass {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03), 0 1px 2px rgba(0, 0, 0, 0.02);
  padding: 16px;
  box-sizing: border-box;
}

/* 1. Overview Grid */
.overview-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.overview-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 12px 16px;

  .card-title {
    font-size: 13px;
    font-weight: 600;
    color: #64748b;
    margin-bottom: 8px;
  }

  .gauge-wrapper {
    width: 90px;
    height: 90px;
    position: relative;
  }

  .gauge-svg {
    width: 100%;
    height: 100%;
  }

  .gauge-track {
    fill: none;
    stroke: #e2e8f0;
    stroke-width: 8;
  }

  .gauge-fill {
    fill: none;
    stroke-width: 8;
    stroke-linecap: round;
    stroke-dasharray: 263.89; // 2 * pi * r (r=42)
    transform: rotate(-90deg);
    transform-origin: 50% 50%;
    transition: stroke-dashoffset 0.8s ease-out;
  }

  .gauge-text {
    font-size: 20px;
    font-weight: 800;
    fill: #0f172a;
    text-anchor: middle;
    font-family: inherit;
  }

  .card-footer-info {
    font-size: 11px;
    color: #64748b;
    margin-top: 10px;
    
    span {
      font-weight: 600;
      color: #0f172a;
    }
  }
}

.overview-stats-column {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-mini-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  flex: 1;

  .stat-icon-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    font-size: 18px;

    &.user-icon {
      background-color: #e0f2fe;
      color: #0284c7;
    }

    &.easy-icon {
      background-color: #dcfce7;
      color: #16a34a;
    }

    &.hard-icon {
      background-color: #ffe4e6;
      color: #dc2626;
    }
  }

  .stat-info {
    display: flex;
    flex-direction: column;
    min-width: 0;

    .stat-label {
      font-size: 10px;
      color: #64748b;
      font-weight: 500;
    }

    .stat-value {
      font-size: 13px;
      font-weight: 700;
      color: #0f172a;
    }
  }
}

.text-ellipsis {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 2. Charts Section */
.charts-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.chart-card {
  .section-title {
    margin: 0 0 12px 0;
    font-size: 14px;
    font-weight: 700;
    color: #0f172a;
  }

  .chart-subtitle {
    margin: -8px 0 12px 0;
    font-size: 11px;
    color: #64748b;
  }
}

/* Donut Chart Distribution styling */
.donut-chart-container {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 8px 0;
}

.donut-chart-wrapper {
  position: relative;
  width: 100px;
  height: 100px;
  flex-shrink: 0;

  .donut-svg {
    width: 100%;
    height: 100%;
  }

  .donut-segment {
    transition: stroke-dashoffset 0.5s ease;
  }

  .donut-center-label {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    pointer-events: none;

    .num {
      font-size: 18px;
      font-weight: 800;
      color: #0f172a;
      line-height: 1;
    }

    .label {
      font-size: 8px;
      color: #64748b;
      margin-top: 2px;
      font-weight: 500;
    }
  }
}

.donut-legend {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;

  .legend-item {
    display: flex;
    align-items: center;
    font-size: 11px;
    color: #475569;
    padding: 3px 6px;
    border-radius: 6px;
    cursor: pointer;
    transition: background-color 0.2s;

    &.active {
      background-color: #f1f5f9;
      font-weight: 600;
    }

    &:active {
      background-color: #e2e8f0;
    }

    .legend-color-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      margin-right: 8px;
      flex-shrink: 0;
    }

    .legend-name {
      flex: 1;
    }

    .legend-count {
      color: #0f172a;
      margin-right: 6px;
    }

    .legend-pct {
      color: #94a3b8;
    }
  }
}



/* 3. Search and User List */
.user-list-section {
  padding-bottom: 24px;
}

.list-controls {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;

  .search-icon {
    position: absolute;
    left: 12px;
    font-size: 16px;
    color: #94a3b8;
  }

  .clear-icon {
    position: absolute;
    right: 12px;
    font-size: 16px;
    color: #94a3b8;
    cursor: pointer;
  }

  .search-input {
    width: 100%;
    height: 38px;
    background: #f1f5f9;
    border: 1px solid #cbd5e1;
    border-radius: 20px;
    padding: 0 36px;
    font-size: 13px;
    color: #0f172a;
    outline: none;
    box-sizing: border-box;
    transition: all 0.2s;

    &:focus {
      border-color: #7c3aed;
      background: #ffffff;
      box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
    }
  }
}

.filter-tabs {
  display: flex;
  gap: 4px;
  overflow-x: auto;
  padding-bottom: 4px;

  &::-webkit-scrollbar {
    height: 0;
  }

  .filter-tab {
    padding: 4px 10px;
    font-size: 11px;
    font-weight: 500;
    color: #64748b;
    background: #f1f5f9;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    white-space: nowrap;
    cursor: pointer;
    transition: all 0.15s;

    &.active {
      color: #ffffff;
      border-color: transparent;

      &.easy { background-color: #10b981; }
      &.medium { background-color: #f59e0b; }
      &.hard { background-color: #f43f5e; }
      &.unknown { background-color: #9ca3af; }
      &:not(.easy):not(.medium):not(.hard):not(.unknown) { background-color: #475569; }
    }

    &:active:not(.active) {
      background-color: #e2e8f0;
    }
  }
}

.user-cards-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.user-analysis-card {
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  background-color: #ffffff;
  overflow: hidden;
  transition: all 0.2s ease;
  cursor: pointer;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
  }

  &.easy {
    border-left: 4px solid #10b981;
    &:hover { border-color: #a7f3d0; border-left-color: #10b981; }
  }
  &.medium {
    border-left: 4px solid #f59e0b;
    &:hover { border-color: #fde68a; border-left-color: #f59e0b; }
  }
  &.hard {
    border-left: 4px solid #f43f5e;
    &:hover { border-color: #fecdd3; border-left-color: #f43f5e; }
  }
  &.unknown {
    border-left: 4px solid #9ca3af;
    &:hover { border-color: #e5e7eb; border-left-color: #9ca3af; }
  }
}

.user-card-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
}

.user-main-info {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;

  .user-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #ffffff;
    font-size: 16px;
    font-weight: 700;
    flex-shrink: 0;
    box-shadow: inset 0 -2px 4px rgba(0,0,0,0.15);
  }

  .user-title-box {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .user-name-wrapper {
    display: flex;
    align-items: center;
    gap: 8px;

    .user-name {
      font-size: 14px;
      font-weight: 700;
      color: #0f172a;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 110px;
    }

    .copy-badge {
      font-size: 9px;
      background-color: #f1f5f9;
      color: #475569;
      padding: 1px 5px;
      border-radius: 4px;
      font-weight: 500;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 2px;
      border: 1px solid #cbd5e1;

      &:active {
        background-color: #e2e8f0;
      }
    }
  }

  .user-record-summary-text {
    font-size: 11px;
    color: #64748b;
    margin-top: 1px;
  }
}

.user-badge-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 3px;

  .difficulty-badge {
    font-size: 9px;
    font-weight: 700;
    padding: 2px 6px;
    border-radius: 4px;
    
    &.easy { background-color: #dcfce7; color: #15803d; }
    &.medium { background-color: #fef3c7; color: #b45309; }
    &.hard { background-color: #ffe4e6; color: #b91c1c; }
    &.unknown { background-color: #f3f4f6; color: #4b5563; }
  }

  .success-rate-text {
    font-size: 11px;
    font-weight: 700;
    color: #0f172a;
  }
}

/* Expanded section */
.user-card-details {
  padding: 0 12px 12px 12px;

  .details-divider {
    height: 1px;
    background-color: #f1f5f9;
    margin-bottom: 10px;
  }

  .details-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .detail-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 11px;

    .detail-label {
      color: #64748b;
      font-weight: 500;
    }

    .detail-value {
      font-weight: 600;

      &.text-highlight {
        color: #7c3aed;
        background-color: #f5f3ff;
        padding: 2px 6px;
        border-radius: 4px;
        border: 1px solid #ddd6fe;
        display: flex;
        align-items: center;
        gap: 3px;
      }
      
      &.text-muted {
        color: #475569;
      }
    }
  }

  .detail-progress-bar {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 65%;

    .progress-bg {
      flex: 1;
      height: 6px;
      background-color: #f1f5f9;
      border-radius: 3px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      border-radius: 3px;
      transition: width 0.3s ease;
    }

    .progress-text {
      font-weight: 600;
      color: #475569;
      min-width: 32px;
      text-align: right;
    }
  }

  .status-distribution {
    display: flex;
    gap: 4px;

    .status-pill {
      font-size: 9px;
      padding: 1px 5px;
      border-radius: 4px;
      font-weight: 500;

      &.green { background-color: #dcfce7; color: #15803d; }
      &.orange { background-color: #ffe4e6; color: #b91c1c; }
      &.gray { background-color: #f3f4f6; color: #4b5563; }
    }
  }
}

/* Micro-animations */
.animate-expand {
  animation: expand-down 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.animate-fade-in {
  animation: fade-in 0.25s ease-out forwards;
}

@keyframes expand-down {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* Calendar styles */
.calendar-header-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;

  .section-title {
    margin: 0;
  }
}

.calendar-nav {
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: #f1f5f9;
  padding: 4px 8px;
  border-radius: 20px;
  border: 1px solid #cbd5e1;

  .nav-arrow {
    font-size: 14px;
    color: #475569;
    cursor: pointer;
    padding: 2px;
    
    &:active {
      transform: scale(0.9);
    }
  }

  .current-month-label {
    font-size: 12px;
    font-weight: 700;
    color: #0f172a;
    min-width: 70px;
    text-align: center;
  }
}

.calendar-grid-container {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.calendar-week-headers {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  
  .week-header {
    font-size: 11px;
    font-weight: 600;
    color: #64748b;
  }
}

.calendar-days-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 6px;
}

.calendar-day-cell {
  aspect-ratio: 1;
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  min-height: 40px;

  .day-number {
    font-size: 12px;
    font-weight: 500;
    color: #475569;
  }

  .day-record-count-badge {
    font-size: 8px;
    color: #94a3b8;
    margin-top: 1px;
  }

  &.empty-cell {
    background-color: transparent;
    border-color: transparent;
    cursor: default;
    pointer-events: none;
  }

  &.has-records {
    border-style: solid;
    font-weight: 600;
  }

  /* Success Day (green) */
  &.success-day {
    background-color: #dcfce7;
    border-color: #86efac;
    
    .day-number { color: #166534; font-weight: 700; }
    .day-record-count-badge { color: #166534; font-weight: 600; }
  }

  /* Fail Day (red) */
  &.fail-day {
    background-color: #ffe4e6;
    border-color: #fca5a5;
    
    .day-number { color: #991b1b; font-weight: 700; }
    .day-record-count-badge { color: #991b1b; font-weight: 600; }
  }

  /* Neutral Day (gray) */
  &.neutral-day {
    background-color: #f1f5f9;
    border-color: #cbd5e1;
    
    .day-number { color: #334155; font-weight: 700; }
    .day-record-count-badge { color: #475569; font-weight: 600; }
  }

  &:hover:not(.empty-cell) {
    transform: translateY(-1px);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  }

  &.active-selected {
    outline: 2.5px solid #7c3aed;
    outline-offset: 1px;
    transform: scale(1.04);
    z-index: 2;
  }
}

/* Selected Day details styles */
.selected-day-details {
  margin-top: 12px;
  padding: 12px;
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;

  .details-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    .details-title {
      font-size: 12px;
      font-weight: 700;
      color: #0f172a;
    }

    .close-details-btn {
      font-size: 11px;
      color: #ef4444;
      cursor: pointer;
      font-weight: 500;
    }
  }

  .details-stats-summary {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    
    .stat-pill {
      font-size: 9px;
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 600;

      &.green { background-color: #dcfce7; color: #166534; }
      &.orange { background-color: #ffe4e6; color: #991b1b; }
      &.gray { background-color: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; }
      &.total { background-color: #f8fafc; color: #64748b; border: 1px solid #e2e8f0; }
      &.rate { background-color: #f5f3ff; color: #6d28d9; border: 1px solid #ddd6fe; }
    }
  }

  .details-records-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
    max-height: 150px;
    overflow-y: auto;
  }

  .detail-record-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #ffffff;
    padding: 6px 10px;
    border-radius: 8px;
    border: 1px solid #f1f5f9;

    .rec-user-info {
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 0;

      .dot-status {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        flex-shrink: 0;

        &.green { background-color: #22c55e; }
        &.orange { background-color: #f97316; }
        &.gray { background-color: #d1d5db; }
      }

      .user-name {
        font-size: 12px;
        font-weight: 700;
        color: #1e293b;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }

    .rec-meta {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 10px;

      .rec-time {
        color: #64748b;
      }

      .rec-source {
        font-size: 8px;
        padding: 1px 4px;
        border-radius: 4px;
        font-weight: 500;
        
        &.active { background-color: #eff6ff; color: #1d4ed8; }
        &.deleted { background-color: #f1f5f9; color: #475569; }
      }
    }
  }

  .details-records-empty {
    font-size: 11px;
    color: #94a3b8;
    text-align: center;
    padding: 10px 0;
  }
}

@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* Chart Trend styles */
.chart-toggles {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-bottom: 12px;
}

.chart-toggle-btn {
  padding: 4px 12px;
  font-size: 11px;
  font-weight: 600;
  color: #64748b;
  background-color: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.15s;

  &.active {
    color: #ffffff;
    background-color: #7c3aed;
    border-color: #7c3aed;
    box-shadow: 0 2px 8px rgba(124, 58, 237, 0.25);
  }

  &:active:not(.active) {
    background-color: #e2e8f0;
  }
}

.svg-chart-container {
  position: relative;
  width: 100%;
  padding-bottom: 4px;
}

.trend-line-svg {
  width: 100%;
  height: auto;
  overflow: visible;
}

.chart-grid-label {
  font-size: 8px;
  font-weight: 500;
  fill: #94a3b8;
}

.interactive-dot {
  cursor: pointer;
  transition: r 0.1s ease, stroke-width 0.1s ease;

  &:hover {
    r: 7;
    stroke-width: 3px;
  }
}

/* Floating Tooltip styling */
.chart-tooltip-box {
  position: absolute;
  background: rgba(15, 23, 42, 0.9);
  color: #ffffff;
  padding: 6px 10px;
  border-radius: 8px;
  font-size: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  pointer-events: none;
  z-index: 10;
  white-space: nowrap;

  .tooltip-date {
    font-weight: 700;
    margin-bottom: 2px;
    color: #e2e8f0;
  }

  .tooltip-val {
    font-weight: 500;
  }
}

.chart-empty-state {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 11px;
  color: #94a3b8;
  font-weight: 500;
  pointer-events: none;
}
</style>

