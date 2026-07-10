<template>
  <div class="difficulty-analysis">
    <!-- Header -->
    <div class="analysis-header">
      <div class="header-left">
        <van-icon name="arrow-left" class="back-btn" id="btn-back" @click="$router.back()" />
        <h1 class="page-title">数据分析</h1>
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
          <div class="calendar-header-wrapper">
            <h2 class="section-title">难度分布比例</h2>
          </div>
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
                  <span class="rec-source" :class="rec.source">{{ rec.source === 'active' ? '监控中' : '已归档' }}</span>
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

        <!-- Leaderboard: Top 10 Stealing Leaderboard -->
        <div class="leaderboard-card glass" id="card-leaderboard">
          <div class="calendar-header-wrapper">
            <h2 class="section-title">红黑Top10</h2>
            <div class="calendar-nav">
              <span class="leaderboard-scope-btn" :class="{ active: leaderboardScope === 'all' }" @click="leaderboardScope = 'all'">全部</span>
              <span class="leaderboard-scope-btn" :class="{ active: leaderboardScope === 'month' }" @click="leaderboardScope = 'month'">
                {{ currentYear }}年{{ String(currentMonth + 1).padStart(2, '0') }}月
              </span>
            </div>
          </div>

          <div class="leaderboard-modes">
            <span
              class="leaderboard-mode-btn easy"
              :class="{ active: leaderboardMode === 'easy' }"
              @click="leaderboardMode = 'easy'"
            >
              <van-icon name="smile-o" /> 最容易偷
            </span>
            <span
              class="leaderboard-mode-btn hard"
              :class="{ active: leaderboardMode === 'hard' }"
              @click="leaderboardMode = 'hard'"
            >
              <van-icon name="warn-o" /> 最难偷
            </span>
          </div>

          <div class="leaderboard-list">
            <div v-if="topTenLeaderboard.length === 0" class="leaderboard-empty">
              暂无匹配的排行榜数据 (需有成功/失败状态标记)
            </div>
            <div
              v-else
              v-for="(item, index) in topTenLeaderboard"
              :key="item.name"
              class="leaderboard-item"
              :class="'rank-' + (index + 1)"
            >
              <div class="rank-number-box">
                <span v-if="index === 0" class="medal gold">🥇</span>
                <span v-else-if="index === 1" class="medal silver">🥈</span>
                <span v-else-if="index === 2" class="medal bronze">🥉</span>
                <span v-else class="rank-num">{{ index + 1 }}</span>
              </div>
              <div class="leaderboard-user-info">
                <div class="leaderboard-user-row">
                  <span class="user-name">{{ item.name }}</span>
                  <span class="attempts-count">尝试 {{ item.success + item.fail }} 次</span>
                </div>
                <div class="leaderboard-progress-wrapper">
                  <div class="progress-bar-bg">
                    <div
                      class="progress-bar-fill"
                      :style="{
                        width: item.successRate + '%',
                        background: leaderboardMode === 'easy' ? 'linear-gradient(90deg, #34d399, #10b981)' : 'linear-gradient(90deg, #f87171, #f43f5e)'
                      }"
                    ></div>
                  </div>
                  <span class="rate-value" :style="{ color: leaderboardMode === 'easy' ? '#10b981' : '#f43f5e' }">
                    {{ item.successRate.toFixed(1) }}% {{ leaderboardMode === 'easy' ? '成功率' : '成功率' }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 3. Search and User List -->
      <section class="user-list-section glass" id="card-users-list">
        <div class="calendar-header-wrapper">
          <h2 class="section-title">用户搜索</h2>
        </div>
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
              v-for="user in displayedUsers"
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
                      <span class="edit-badge" @click.stop="showEditNameDialog(user.name)">
                        <van-icon name="edit" /> 修改
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
          <!-- Pagination -->
          <div v-if="filteredUsers.length > 5" class="pagination-container">
            <van-pagination
              v-model="currentPage"
              :total-items="filteredUsers.length"
              :items-per-page="5"
              force-ellipses
            >
              <template #prev-text>
                <van-icon name="arrow-left" />
              </template>
              <template #next-text>
                <van-icon name="arrow" />
              </template>
            </van-pagination>
          </div>
        </div>
      </section>

      <!-- 4. Data Rectification -->
      <section class="rectification-section glass" id="card-rectification">
        <div class="calendar-header-wrapper">
          <h2 class="section-title">数据纠偏</h2>
        </div>
        <p class="section-subtitle">分析并找出可能由于拼写错误、空格多余、英文大小写或字词包含关系而导致重复的用户名。点击对应标签标签可实现一键合并更新。</p>
        
        <div class="rectification-content">
          <div v-if="suggestedCorrectionGroups.length === 0" class="rectify-empty-state">
            <van-icon name="passed" class="empty-icon" />
            <span class="empty-text">未发现拼写相近的重复用户，数据质量良好！</span>
          </div>
          
          <div v-else class="rectify-groups-list">
            <div
              v-for="(group, gIdx) in displayedRectifyGroups"
              :key="group.users.map(u => u.name).join('-')"
              class="rectify-group-card"
            >
              <div class="group-header">
                <span class="match-badge">匹配组 #{{ ((currentRectifyPage - 1) * 5) + gIdx + 1 }}</span>
                <span class="similarity-text">相似度: {{ (group.similarity * 100).toFixed(0) }}%</span>
              </div>
              <div class="group-names">
                <span
                  v-for="user in group.users"
                  :key="user.name"
                  class="group-name-tag"
                  @click="quickRectifyTo(user.name, group.users)"
                  title="点击将本组内其他用户合并为此名称"
                >
                  <van-icon name="user-o" class="tag-user-icon" />
                  <span class="tag-name-text">{{ user.name }}</span>
                  <span class="tag-count-badge">{{ user.total }}次</span>
                </span>
              </div>
              <p class="group-hint">💡 点击上方任意标签，可将本组其他用户名全部“一键合并”为该名称并重算。</p>
            </div>
            
            <!-- Pagination for Rectification -->
            <div v-if="suggestedCorrectionGroups.length > 5" class="pagination-container">
              <van-pagination
                v-model="currentRectifyPage"
                :total-items="suggestedCorrectionGroups.length"
                :items-per-page="5"
                force-ellipses
              >
                <template #prev-text>
                  <van-icon name="arrow-left" />
                </template>
                <template #next-text>
                  <van-icon name="arrow" />
                </template>
              </van-pagination>
            </div>
          </div>
        </div>
      </section>
    </div>
    <!-- Beautiful Redesigned Edit Name Popup -->
    <van-popup
      v-model="showEditDialog"
      round
      position="center"
      class="edit-name-popup"
      :close-on-click-overlay="false"
    >
      <div class="edit-popup-container">
        <div class="edit-popup-header">
          <van-icon name="edit" class="header-icon" />
          <span class="header-title">修改名称</span>
          <p class="header-subtitle">修改后将同步更新所有历史记录及统计图表</p>
        </div>
        
        <div class="edit-popup-body">
          <div class="input-wrapper">
            <span class="input-label">当前名称</span>
            <div class="old-name-display">{{ editTargetOldName }}</div>
          </div>
          
          <div class="input-wrapper">
            <span class="input-label">新名称</span>
            <div class="custom-field-container">
              <van-icon name="contact" class="field-icon" />
              <input
                v-model="editTargetNewName"
                type="text"
                class="custom-field-input"
                placeholder="请输入新名称"
                ref="editField"
              />
            </div>
          </div>
        </div>
        
        <div class="edit-popup-footer">
          <button class="footer-btn btn-cancel" @click="cancelEditName">取消</button>
          <button class="footer-btn btn-confirm" @click="confirmEditName">确认修改</button>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script>
import { Icon, Empty, Toast, Dialog, Field, Popup, Pagination } from 'vant';

const STORAGE_KEY = 'maturity_tracking_data';

export default {
  name: 'DifficultyAnalysis',
  components: {
    [Icon.name]: Icon,
    [Empty.name]: Empty,
    [Toast.name]: Toast,
    [Dialog.Component.name]: Dialog.Component,
    [Field.name]: Field,
    [Popup.name]: Popup,
    [Pagination.name]: Pagination
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
      },
      showEditDialog: false,
      editTargetOldName: '',
      editTargetNewName: '',
      leaderboardScope: 'all', // 'all' or 'month'
      leaderboardMode: 'easy',  // 'easy' or 'hard'
      currentPage: 1,
      currentRectifyPage: 1
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
    displayedUsers() {
      const start = (this.currentPage - 1) * 5;
      const end = start + 5;
      return this.filteredUsers.slice(start, end);
    },
    displayedRectifyGroups() {
      const start = (this.currentRectifyPage - 1) * 5;
      const end = start + 5;
      return this.suggestedCorrectionGroups.slice(start, end);
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
    },
    topTenLeaderboard() {
      const scope = this.leaderboardScope;
      const year = this.currentYear;
      const month = this.currentMonth;
      
      const userMap = {};

      const process = (row, status, dateStr) => {
        if (!row.name) return;
        const cleanName = row.name.trim();
        if (!cleanName) return;

        // Apply Month Filter if selected
        if (scope === 'month' && dateStr) {
          const d = new Date(dateStr);
          if (isNaN(d.getTime()) || d.getFullYear() !== year || d.getMonth() !== month) {
            return;
          }
        }

        if (!userMap[cleanName]) {
          userMap[cleanName] = {
            name: cleanName,
            success: 0,
            fail: 0,
            unmarked: 0
          };
        }

        const user = userMap[cleanName];
        if (status === 'green') {
          user.success++;
        } else if (status === 'orange') {
          user.fail++;
        } else {
          user.unmarked++;
        }
      };

      // 1. Process active records (assume today's date context)
      const todayStr = this.getLocalDateString(new Date());
      this.tableData.forEach(row => {
        const status = this.stolenMap[row.id] || '';
        process(row, status, todayStr);
      });

      // 2. Process deleted records (using their deletedAt date context)
      this.deletedData.forEach(row => {
        const status = row.stolenStatus || this.stolenMap[row.id] || '';
        const dateStr = row.deletedAt ? this.getLocalDateString(row.deletedAt) : '';
        process(row, status, dateStr);
      });

      // 3. Map records to rates and filter zero attempt rows
      const list = Object.values(userMap)
        .map(u => {
          const attempts = u.success + u.fail;
          const successRate = attempts > 0 ? (u.success / attempts) * 100 : 0;
          return {
            ...u,
            attempts,
            successRate
          };
        })
        .filter(u => u.attempts > 0);

      // 4. Sort and return top 10
      if (this.leaderboardMode === 'easy') {
        // Most Easy to steal (High success rate desc, then high success count desc)
        return list.sort((a, b) => {
          if (b.successRate !== a.successRate) {
            return b.successRate - a.successRate;
          }
          return b.success - a.success;
        }).slice(0, 10);
      } else {
        // Hardest to steal (Low success rate asc, then high fail count desc)
        return list.sort((a, b) => {
          if (a.successRate !== b.successRate) {
            return a.successRate - b.successRate;
          }
          return b.fail - a.fail;
        }).slice(0, 10);
      }
    },
    suggestedCorrectionGroups() {
      const users = this.analyzedUsers.map(u => ({
        name: u.name,
        total: u.total
      }));
      
      const groups = [];
      const visited = new Set();
      
      for (let i = 0; i < users.length; i++) {
        if (visited.has(users[i].name)) continue;
        
        const currentGroup = [users[i]];
        let maxSimilarity = 0;
        
        for (let j = i + 1; j < users.length; j++) {
          if (visited.has(users[j].name)) continue;
          
          const nameA = users[i].name;
          const nameB = users[j].name;
          
          const sim = this.calculateNameSimilarity(nameA, nameB);
          if (sim >= 0.6) {
            currentGroup.push(users[j]);
            maxSimilarity = Math.max(maxSimilarity, sim);
          }
        }
        
        if (currentGroup.length > 1) {
          currentGroup.forEach(u => visited.add(u.name));
          groups.push({
            users: currentGroup,
            similarity: maxSimilarity
          });
        }
      }
      
      return groups;
    }
  },
  watch: {
    searchQuery() {
      this.currentPage = 1;
    },
    currentDifficultyFilter() {
      this.currentPage = 1;
    },
    suggestedCorrectionGroups() {
      this.currentRectifyPage = 1;
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
          this.tableData = (parsed.tableData || []).map(row => {
            if (row.deletedAt) {
              const cleanRow = { ...row };
              delete cleanRow.deletedAt;
              return cleanRow;
            }
            return row;
          });
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
    showEditNameDialog(oldName) {
      this.editTargetOldName = oldName;
      this.editTargetNewName = oldName;
      this.showEditDialog = true;
      this.$nextTick(() => {
        if (this.$refs.editField) {
          this.$refs.editField.focus();
        }
      });
    },
    cancelEditName() {
      this.showEditDialog = false;
    },
    confirmEditName() {
      const newName = this.editTargetNewName ? this.editTargetNewName.trim() : '';
      if (!newName) {
        this.$toast.fail('名称不能为空');
        return;
      }

      if (newName === this.editTargetOldName.trim()) {
        this.showEditDialog = false;
        return;
      }

      const oldName = this.editTargetOldName.trim();
      let updatedCount = 0;

      // 1. Update tableData in local state
      this.tableData.forEach(row => {
        if (row.name && row.name.trim() === oldName) {
          row.name = newName;
          updatedCount++;
        }
      });

      // 2. Update deletedData in local state
      this.deletedData.forEach(row => {
        if (row.name && row.name.trim() === oldName) {
          row.name = newName;
          updatedCount++;
        }
      });

      // 3. Save to localStorage
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          parsed.tableData = this.tableData;
          parsed.deletedData = this.deletedData;
          localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
        }
        
        // 4. Update expanded state if expanded
        this.expandedUsers = this.expandedUsers.map(name => {
          if (name === oldName) return newName;
          return name;
        });

        // 5. Recalculate analysis data
        this.runAnalysis();
        this.$toast.success(`修改成功，共更新 ${updatedCount} 条记录`);
        this.showEditDialog = false;
      } catch (e) {
        console.error('保存修改名称失败:', e);
        this.$toast.fail('保存失败，请重试');
      }
    },
    calculateNameSimilarity(nameA, nameB) {
      const a = nameA.trim().toLowerCase();
      const b = nameB.trim().toLowerCase();
      
      if (a === b) return 1.0;
      
      if (a.includes(b) || b.includes(a)) {
        const lenDiff = Math.abs(a.length - b.length);
        if (lenDiff <= 3) {
          return 0.85;
        }
      }
      
      const dist = this.getEditDistance(a, b);
      const maxLen = Math.max(a.length, b.length);
      if (maxLen === 0) return 0;
      
      return 1.0 - (dist / maxLen);
    },
    getEditDistance(a, b) {
      if (a.length === 0) return b.length;
      if (b.length === 0) return a.length;
      const matrix = [];
      for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
      }
      for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
      }
      for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
          if (b.charAt(i - 1) === a.charAt(j - 1)) {
            matrix[i][j] = matrix[i - 1][j - 1];
          } else {
            matrix[i][j] = Math.min(
              matrix[i - 1][j - 1] + 1,
              Math.min(
                matrix[i][j - 1] + 1,
                matrix[i - 1][j] + 1
              )
            );
          }
        }
      }
      return matrix[b.length][a.length];
    },
    quickRectifyTo(targetName, groupUsers) {
      const otherNames = groupUsers
        .map(u => u.name)
        .filter(name => name !== targetName);
        
      if (otherNames.length === 0) return;
      
      Dialog.confirm({
        title: '一键合并数据',
        message: `确定要将用户组内的：\n"${otherNames.join('", "')}"\n全部合并并重命名为 "${targetName}" 吗？\n\n此操作将合并更新他们的所有历史记录，并重新计算全部数据。`,
        confirmButtonColor: '#7c3aed'
      }).then(() => {
        let totalUpdated = 0;
        
        // 1. Update in tableData
        this.tableData.forEach(row => {
          if (row.name && otherNames.includes(row.name.trim())) {
            row.name = targetName;
            totalUpdated++;
          }
        });
        
        // 2. Update in deletedData
        this.deletedData.forEach(row => {
          if (row.name && otherNames.includes(row.name.trim())) {
            row.name = targetName;
            totalUpdated++;
          }
        });
        
        // 3. Save to localStorage
        try {
          const saved = localStorage.getItem(STORAGE_KEY);
          if (saved) {
            const parsed = JSON.parse(saved);
            parsed.tableData = this.tableData;
            parsed.deletedData = this.deletedData;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
          }
          
          // 4. Update expanded users
          this.expandedUsers = this.expandedUsers.map(name => {
            if (otherNames.includes(name)) return targetName;
            return name;
          });
          
          // 5. Recalculate
          this.runAnalysis();
          this.$toast.success(`合并成功！共重命名合并 ${totalUpdated} 条记录`);
        } catch (e) {
          console.error('合并纠偏失败:', e);
          this.$toast.fail('保存合并数据失败，请重试');
        }
      }).catch(() => {});
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

    .edit-badge {
      font-size: 9px;
      background-color: #eff6ff;
      color: #1d4ed8;
      padding: 1px 5px;
      border-radius: 4px;
      font-weight: 500;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 2px;
      border: 1px solid #bfdbfe;

      &:active {
        background-color: #dbeafe;
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
    font-size: 15px;
    font-weight: 700;
    color: #0f172a;
    display: flex;
    align-items: center;
    gap: 8px;
    line-height: 1.2;
    text-align: left;

    &:not(:empty)::before {
      content: "";
      width: 4px;
      height: 16px;
      background: linear-gradient(to bottom, #7c3aed, #6366f1);
      border-radius: 2px;
      display: inline-block;
      flex-shrink: 0;
    }
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

/* Leaderboard Card styling */
.leaderboard-card {
  margin-top: 16px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.leaderboard-scope-btn {
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 600;
  color: #64748b;
  background-color: rgba(241, 245, 249, 0.6);
  border: 1px solid rgba(226, 232, 240, 0.8);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;

  &.active {
    color: #ffffff;
    background-color: #7c3aed;
    border-color: #7c3aed;
    box-shadow: 0 2px 6px rgba(124, 58, 237, 0.2);
  }
}

.leaderboard-modes {
  display: flex;
  justify-content: center;
  gap: 12px;
}

.leaderboard-mode-btn {
  flex: 1;
  padding: 8px;
  font-size: 12px;
  font-weight: 600;
  text-align: center;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  box-sizing: border-box;

  &.easy {
    color: #047857;
    background-color: #ecfdf5;
    border: 1.5px solid #a7f3d0;

    &.active {
      color: #ffffff;
      background: linear-gradient(135deg, #34d399 0%, #10b981 100%);
      border-color: #10b981;
      box-shadow: 0 4px 10px rgba(16, 185, 129, 0.2);
    }
  }

  &.hard {
    color: #b91c1c;
    background-color: #fef2f2;
    border: 1.5px solid #fca5a5;

    &.active {
      color: #ffffff;
      background: linear-gradient(135deg, #f87171 0%, #f43f5e 100%);
      border-color: #f43f5e;
      box-shadow: 0 4px 10px rgba(244, 63, 94, 0.2);
    }
  }
}

.leaderboard-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.leaderboard-empty {
  font-size: 12px;
  color: #94a3b8;
  text-align: center;
  padding: 30px 0;
  font-weight: 500;
}

.leaderboard-item {
  display: flex;
  align-items: center;
  gap: 10px;
  background-color: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(241, 245, 249, 0.8);
  border-radius: 12px;
  padding: 8px 12px;
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.02);
  transition: transform 0.2s ease, background-color 0.2s ease;

  &:hover {
    transform: translateY(-1px);
    background-color: #ffffff;
  }

  /* Rank special highlights */
  &.rank-1 {
    background-color: rgba(254, 243, 199, 0.4);
    border-color: rgba(252, 211, 77, 0.5);
  }
  &.rank-2 {
    background-color: rgba(241, 245, 249, 0.4);
    border-color: rgba(203, 213, 225, 0.5);
  }
  &.rank-3 {
    background-color: rgba(255, 237, 213, 0.4);
    border-color: rgba(253, 186, 116, 0.5);
  }
}

.rank-number-box {
  width: 24px;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-shrink: 0;

  .medal {
    font-size: 18px;
  }

  .rank-num {
    font-size: 12px;
    font-weight: 700;
    color: #64748b;
    background-color: #f1f5f9;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.leaderboard-user-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.leaderboard-user-row {
  display: flex;
  justify-content: space-between;
  align-items: center;

  .user-name {
    font-size: 13px;
    font-weight: 700;
    color: #1e293b;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .attempts-count {
    font-size: 10px;
    color: #64748b;
    font-weight: 500;
  }
}

.leaderboard-progress-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;

  .progress-bar-bg {
    flex: 1;
    height: 6px;
    background-color: #f1f5f9;
    border-radius: 3px;
    overflow: hidden;
  }

  .progress-bar-fill {
    height: 100%;
    border-radius: 3px;
    transition: width 0.3s ease;
  }

  .rate-value {
    font-size: 11px;
    font-weight: 700;
    flex-shrink: 0;
    width: 80px;
    text-align: right;
  }
}

/* Redesigned Edit Name Popup styling */
.edit-name-popup {
  width: 85%;
  max-width: 320px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(226, 232, 240, 0.8);
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.15);
  
  .edit-popup-container {
    padding: 24px 20px;
    display: flex;
    flex-direction: column;
    gap: 18px;
  }
  
  .edit-popup-header {
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    
    .header-icon {
      font-size: 24px;
      color: #7c3aed;
      background-color: #f3e8ff;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 4px;
    }
    
    .header-title {
      font-size: 16px;
      font-weight: 700;
      color: #0f172a;
    }
    
    .header-subtitle {
      font-size: 11px;
      color: #64748b;
      line-height: 1.4;
      margin: 0;
    }
  }
  
  .edit-popup-body {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  
  .input-wrapper {
    display: flex;
    flex-direction: column;
    gap: 6px;
    
    .input-label {
      font-size: 11px;
      font-weight: 600;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .old-name-display {
      background-color: #f1f5f9;
      border: 1.5px solid #e2e8f0;
      border-radius: 8px;
      padding: 10px 14px;
      font-size: 14px;
      font-weight: 500;
      color: #64748b;
      text-align: left;
    }
  }
  
  .custom-field-container {
    display: flex;
    align-items: center;
    gap: 8px;
    background-color: #ffffff;
    border: 2.5px solid #e2e8f0;
    border-radius: 8px;
    padding: 0 12px;
    height: 42px;
    transition: all 0.2s ease;
    
    .field-icon {
      font-size: 16px;
      color: #94a3b8;
    }
    
    .custom-field-input {
      flex: 1;
      border: none;
      outline: none;
      font-size: 14px;
      font-weight: 600;
      color: #1e293b;
      height: 100%;
      background: transparent;
      padding: 0;
      
      &::placeholder {
        color: #cbd5e1;
        font-weight: 400;
      }
    }
    
    &:focus-within {
      border-color: #7c3aed;
      box-shadow: 0 0 0 3.5px rgba(124, 58, 237, 0.15);
      
      .field-icon {
        color: #7c3aed;
      }
    }
  }
  
  .edit-popup-footer {
    display: flex;
    gap: 10px;
    margin-top: 6px;
  }
  
  .footer-btn {
    flex: 1;
    height: 40px;
    font-size: 13px;
    font-weight: 700;
    border-radius: 8px;
    border: none;
    cursor: pointer;
    transition: all 0.2s ease;
    
    &.btn-cancel {
      color: #64748b;
      background-color: #f1f5f9;
      
      &:active {
        background-color: #e2e8f0;
      }
    }
    
    &.btn-confirm {
      color: #ffffff;
      background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
      box-shadow: 0 4px 12px rgba(124, 58, 237, 0.25);
      
      &:active {
        transform: scale(0.98);
        box-shadow: 0 2px 6px rgba(124, 58, 237, 0.2);
      }
    }
  }
}

/* Data Rectification Section styling */
.rectification-section {
  margin-top: 16px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  
  .section-subtitle {
    font-size: 11px;
    color: #64748b;
    line-height: 1.5;
    margin: 0 0 6px 0;
    text-align: left;
  }
}

.rectify-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px 0;
  gap: 8px;
  
  .empty-icon {
    font-size: 32px;
    color: #10b981;
  }
  
  .empty-text {
    font-size: 12px;
    color: #64748b;
    font-weight: 500;
  }
}

.rectify-groups-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.rectify-group-card {
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(226, 232, 240, 0.8);
  border-radius: 12px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.02);
  
  .group-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    .match-badge {
      font-size: 10px;
      font-weight: 700;
      color: #7c3aed;
      background-color: #f3e8ff;
      padding: 2px 6px;
      border-radius: 4px;
    }
    
    .similarity-text {
      font-size: 11px;
      font-weight: 700;
      color: #10b981;
    }
  }
  
  .group-names {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  
  .group-name-tag {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    background-color: #ffffff;
    border: 1.5px solid #e2e8f0;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    
    .tag-user-icon {
      font-size: 12px;
      color: #94a3b8;
    }
    
    .tag-name-text {
      font-size: 12px;
      font-weight: 600;
      color: #1e293b;
    }
    
    .tag-count-badge {
      font-size: 9px;
      font-weight: 700;
      color: #64748b;
      background-color: #f1f5f9;
      padding: 1px 4px;
      border-radius: 4px;
    }
    
    &:hover {
      border-color: #7c3aed;
      background-color: #f5f3ff;
      transform: translateY(-1px);
      box-shadow: 0 2px 6px rgba(124, 58, 237, 0.1);
      
      .tag-user-icon {
        color: #7c3aed;
      }
      
      .tag-name-text {
        color: #7c3aed;
      }
    }
    
    &:active {
      transform: scale(0.97);
    }
  }
  
  .group-hint {
    font-size: 10px;
    color: #64748b;
    margin: 0;
    line-height: 1.4;
    text-align: left;
  }
}

/* Pagination styling */
.pagination-container {
  margin-top: 20px;
  padding: 10px 0;
  display: flex;
  justify-content: center;

  /deep/ .van-pagination {
    width: 100%;
    max-width: 320px;
    gap: 6px; /* Added spacing gap between numbers/buttons */
    
    .van-pagination__item {
      color: #7c3aed;
      border-radius: 8px !important; /* Forces rounded borders on every single detached button */
      background: #ffffff;
      border: 1px solid #ddd6fe;
      font-size: 13px;
      font-weight: 600;
      transition: all 0.2s;

      &.van-pagination__item--active {
        color: #ffffff;
        background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
        border-color: #7c3aed;
        box-shadow: 0 4px 12px rgba(124, 58, 237, 0.25);
      }

      &.van-pagination__item--disabled {
        color: #cbd5e1;
        background-color: #f8fafc;
        border-color: #e2e8f0;
        opacity: 0.6;
      }
      
      &:active:not(.van-pagination__item--disabled):not(.van-pagination__item--active) {
        background-color: #f5f3ff;
      }
    }
  }
}
</style>

