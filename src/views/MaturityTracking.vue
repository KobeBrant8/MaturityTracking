<template>
  <div class="maturity-tracking">
    <div class="header">
      <h2 class="page-title"></h2>
      <div class="header-actions">
        <div class="memo-name-wrapper">
          <input
            v-model="memoName"
            type="text"
            class="memo-name-input"
            placeholder="备忘"
          />
          <span class="memo-copy-icon" @click="copyName(memoName)">
            <i class="copy-icon-back"></i>
            <i class="copy-icon-front"></i>
          </span>
        </div>
        <div class="action-btn" @click="showSearch = true">
          <van-icon name="search" class="action-icon search-icon" />
          <span class="action-text">搜索</span>
        </div>
        <div class="action-btn" @click="clearExpired">
          <van-icon name="delete-o" class="action-icon clear-expired-icon" />
          <span class="action-text">清除过期</span>
        </div>
        <div class="action-btn" @click="clearAll">
          <van-icon name="delete" class="action-icon clear-all-icon" />
          <span class="action-text">清除全部</span>
        </div>
        <div class="action-btn" @click="addRow">
          <van-icon name="add-o" class="action-icon add-icon" />
          <span class="action-text">新增</span>
        </div>
      </div>
    </div>

    <div class="table-wrapper">
      <van-empty v-if="tableData.length === 0" description="暂无数据，请点击新增" />

      <table v-else class="data-table">
        <thead>
          <tr>
            <th class="th-index">#</th>
            <th class="th-name">用户</th>
            <th class="th-time">成熟时间</th>
            <th class="th-action">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(row, index) in sortedTableData"
            :key="row.id"
            :data-id="row.id"
            @dblclick="copyName(row.name)"
            :class="{
              'nearest-row': nearestEntryId === row.id && row.maturityTime,
              'expired-row': isRowExpired(row),
              'marked-row': markedIds.includes(row.id)
            }"
          >
            <td class="td-index" style="position:relative;">
              <span
                class="stolen-dot"
                :class="stolenMap[row.id] || 'gray'"
                @click.stop="toggleStolenPopover(row.id)"
              ></span>
              <div
                v-if="expandedStolenId === row.id"
                class="stolen-popover"
                @click.stop
              >
                <span class="stolen-popover-arrow"></span>
                <span
                  class="stolen-dot green"
                  :class="{ active: stolenMap[row.id] === 'green' }"
                  @click="selectStolen(row.id, 'green')"
                ></span>
                <span
                  class="stolen-dot orange"
                  :class="{ active: stolenMap[row.id] === 'orange' }"
                  @click="selectStolen(row.id, 'orange')"
                ></span>
              </div>
              {{ index + 1 }}
            </td>
            <td :class="['td-name', { 'name-empty': !row.name }]">
              <van-field
                v-model="row.name"
                placeholder="输入用户名"
                :border="false"
                input-align="left"
              />
            </td>
            <td class="td-time" @click="openTimePicker(row)">
              <span :class="{ 'time-value': row.maturityTime, 'time-placeholder': !row.maturityTime }">
                {{ row.maturityTime || '点击设置' }}
              </span>
              <div v-if="nearestEntryId === row.id && getRemainingSeconds(row) > 0" class="countdown-tag">
                {{ formatRemainingTime(getRemainingSeconds(row)) }}
              </div>
            </td>
            <td class="td-action">
              <van-icon
                :name="markedIds.includes(row.id) ? 'star' : 'star-o'"
                class="action-icon mark-icon"
                :class="{ 'marked': markedIds.includes(row.id) }"
                @click.stop="toggleMark(row.id)"
              />
              <van-icon name="delete-o" class="action-icon delete-icon" @click="deleteRowById(row.id)" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showSearch" class="search-overlay" @click.self="showSearch = false">
      <div class="search-bar">
        <van-icon name="search" class="search-bar-icon" />
        <input
          ref="searchInput"
          v-model="searchKeyword"
          type="text"
          class="search-bar-input"
          placeholder="输入用户名搜索"
          @keydown.escape="showSearch = false"
        />
        <van-icon
          v-if="searchKeyword"
          name="clear"
          class="search-bar-clear"
          @click="clearSearch"
        />
      </div>
      <div v-if="searchKeyword && filteredData.length > 0" class="search-results">
        <div
          v-for="row in filteredData"
          :key="row.id"
          class="search-result-item"
          @click="scrollToRow(row.id)"
        >
          <span class="result-name">{{ row.name || '未命名' }}</span>
          <span class="result-time">{{ row.maturityTime }}</span>
        </div>
      </div>
    </div>

    <van-popup v-model="showTimePicker" position="bottom" round>
      <div class="time-picker-container">
        <div class="picker-header">
          <span class="picker-btn picker-cancel" @click="onTimePickerCancel">取消</span>
          <div class="picker-title">{{ isAddingNew ? '新增记录' : '编辑时间' }}</div>
          <span class="picker-btn picker-confirm" @click="onTimeConfirm">确认</span>
        </div>
        <div class="picker-body">
          <div class="name-input-section">
            <label class="input-label">用户名</label>
            <input
              ref="popupNameInput"
              v-model="editName"
              type="text"
              class="popup-name-input"
              placeholder="请输入用户名"
              @keydown.enter="focusNext('hour')"
            />
          </div>
          <div class="time-input-section">
            <label class="input-label">倒计时</label>
            <div class="time-input-wrapper">
              <div class="time-input-item">
                <input
                  ref="popupHourInput"
                  v-model="editHour"
                  type="text"
                  maxlength="2"
                  class="popup-time-input"
                  placeholder="00"
                  @input="onTimeInput('hour')"
                  @keydown.enter="focusNext('minute')"
                  @keydown.right="focusNext('minute')"
                />
                <span class="time-label">时</span>
              </div>
              <span class="time-colon">:</span>
              <div class="time-input-item">
                <input
                  ref="popupMinuteInput"
                  v-model="editMinute"
                  type="text"
                  maxlength="2"
                  class="popup-time-input"
                  placeholder="00"
                  @input="onTimeInput('minute')"
                  @keydown.enter="focusNext('second')"
                  @keydown.left="focusPrev('hour')"
                  @keydown.right="focusNext('second')"
                />
                <span class="time-label">分</span>
              </div>
              <span class="time-colon">:</span>
              <div class="time-input-item">
                <input
                  ref="popupSecondInput"
                  v-model="editSecond"
                  type="text"
                  maxlength="2"
                  class="popup-time-input"
                  placeholder="00"
                  @input="onTimeInput('second')"
                  @keydown.enter="onTimeConfirm"
                  @keydown.left="focusPrev('minute')"
                />
                <span class="time-label">秒</span>
              </div>
            </div>
          </div>
          <div class="time-hint">设置后将在倒计时结束时提醒您</div>
        </div>
      </div>
    </van-popup>

    <van-popup v-model="showReminder" position="center" round>
      <div class="reminder-dialog">
        <span class="reminder-stolen-dot" @click.stop>
          <span class="stolen-dot green" @click="selectStolenFromReminder('green')"></span>
          <span class="stolen-dot orange" @click="selectStolenFromReminder('orange')"></span>
        </span>
        <div class="reminder-title">成熟时间提醒</div>
        <div class="reminder-body">
          <div class="reminder-message">{{ reminderName }} 的成熟时间已到！</div>
          <div class="reminder-time">成熟时间：{{ reminderTime }}</div>
          <div class="reminder-copy" @click="copyReminderName">复制名称</div>
        </div>
      </div>
    </van-popup>

    <transition name="fade">
      <div v-if="showBackTop" class="back-top" @click="scrollToTop">
        <van-icon name="arrow-up" />
      </div>
    </transition>
  </div>
</template>

<script>
import { Button, Field, Popup, Empty, Icon, Dialog, Toast } from 'vant';

const STORAGE_KEY = 'maturity_tracking_data';

export default {
  name: 'MaturityTracking',
  components: {
    [Button.name]: Button,
    [Field.name]: Field,
    [Popup.name]: Popup,
    [Empty.name]: Empty,
    [Icon.name]: Icon,
    [Dialog.name]: Dialog,
    [Toast.name]: Toast
  },
  data() {
    return {
      tableData: [],
      showTimePicker: false,
      showSearch: false,
      searchKeyword: '',
      editingId: null,
      editName: '',
      editHour: '',
      editMinute: '',
      editSecond: '',
      isAddingNew: false,
      pendingNewRow: null,
      nextId: 1,
      maturityTimer: null,
      now: Date.now(),
      notifiedIds: [],
      markedIds: [],
      stolenMap: {},
      expandedStolenId: null,
      showBackTop: false,
      showReminder: false,
      reminderRowId: null,
      reminderName: '',
      reminderTime: '',
      memoName: ''
    };
  },
  computed: {
    sortedTableData() {
      return [...this.tableData].sort((a, b) => {
        const aExpired = this.isRowExpired(a);
        const bExpired = this.isRowExpired(b);
        if (aExpired !== bExpired) return aExpired ? 1 : -1;
        if (!a.maturityTime && !b.maturityTime) return 0;
        if (!a.maturityTime) return 1;
        if (!b.maturityTime) return -1;
        return a.maturityTime.localeCompare(b.maturityTime);
      });
    },
    nearestEntryId() {
      let minRemaining = Infinity;
      let nearestId = null;
      for (const row of this.tableData) {
        if (!row.maturityTime) continue;
        if (this.isRowExpired(row)) continue;
        const remaining = this.getRemainingSeconds(row);
        if (remaining > 0 && remaining < minRemaining) {
          minRemaining = remaining;
          nearestId = row.id;
        }
      }
      return nearestId;
    },
    filteredData() {
      if (!this.searchKeyword) return [];
      const keyword = this.searchKeyword.toLowerCase();
      return this.tableData.filter(row => 
        row.name && row.name.toLowerCase().includes(keyword)
      );
    }
  },
  created() {
    this.loadData();
  },
  mounted() {
    this.startMaturityCheck();
    document.addEventListener('click', this.closeStolenPicker);
    window.addEventListener('scroll', this.handleScroll);
  },
  beforeDestroy() {
    document.removeEventListener('click', this.closeStolenPicker);
    window.removeEventListener('scroll', this.handleScroll);
    this.stopMaturityCheck();
  },
  watch: {
    tableData: {
      handler() {
        this.saveData();
      },
      deep: true
    },
    showTimePicker(val) {
      if (val) {
        this.$nextTick(() => {
          if (this.isAddingNew && this.$refs.popupNameInput) {
            this.$refs.popupNameInput.focus();
          } else if (this.$refs.popupMinuteInput) {
            this.$refs.popupMinuteInput.focus();
          }
        });
      }
    },
    showSearch(val) {
      if (val) {
        this.$nextTick(() => {
          if (this.$refs.searchInput) {
            this.$refs.searchInput.focus();
          }
        });
      } else {
        this.searchKeyword = '';
      }
    },
    memoName() {
      this.saveData();
    },
    markedIds() {
      this.saveData();
    },
    notifiedIds() {
      this.saveData();
    },
    stolenMap: {
      handler() {
        this.saveData();
      },
      deep: true
    }
  },
  methods: {
    loadData() {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          this.tableData = parsed.tableData || [];
          this.nextId = parsed.nextId || 1;
          this.memoName = parsed.memoName || '';
          this.markedIds = parsed.markedIds || [];
          this.notifiedIds = parsed.notifiedIds || [];
          this.stolenMap = parsed.stolenMap || {};
        }
      } catch (e) {
        console.error('加载数据失败:', e);
      }
    },

    saveData() {
      try {
        const data = {
          tableData: this.tableData,
          nextId: this.nextId,
          memoName: this.memoName,
          markedIds: this.markedIds,
          notifiedIds: this.notifiedIds,
          stolenMap: this.stolenMap
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch (e) {
        console.error('保存数据失败:', e);
      }
    },

    deleteRow(index) {
      this.$dialog.confirm({
        title: '确认删除',
        message: '确定要删除这条数据吗？'
      }).then(() => {
        this.tableData.splice(index, 1);
      }).catch(() => {});
    },

    copyName(name) {
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

    addRow() {
      this.pendingNewRow = {
        id: this.nextId++,
        name: '',
        upcomingTime: '',
        maturityTime: ''
      };
      this.isAddingNew = true;
      this.editingId = null;
      this.editName = '';
      this.editHour = '';
      this.editMinute = '';
      this.editSecond = '';
      this.showTimePicker = true;
    },

    getOriginalIndex(id) {
      return this.tableData.findIndex(row => row.id === id);
    },

    openTimePicker(row) {
      this.editingId = row.id;
      this.isAddingNew = false;
      this.editName = row.name || '';
      const remaining = this.getRemainingSeconds(row);
      if (remaining > 0 && remaining !== Infinity) {
        const h = Math.floor(remaining / 3600);
        const m = Math.floor((remaining % 3600) / 60);
        const s = remaining % 60;
        this.editHour = String(h).padStart(2, '0');
        this.editMinute = String(m).padStart(2, '0');
        this.editSecond = String(s).padStart(2, '0');
      } else if (row.upcomingTime) {
        const parts = row.upcomingTime.split(':');
        this.editHour = parts[0] || '';
        this.editMinute = parts[1] || '';
        this.editSecond = parts[2] || '';
      } else {
        this.editHour = '';
        this.editMinute = '';
        this.editSecond = '';
      }
      this.showTimePicker = true;
    },

    onTimeInput(type) {
      if (type === 'hour') {
        this.editHour = this.editHour.replace(/[^0-9]/g, '');
        if (this.editHour.length === 2) {
          const val = parseInt(this.editHour);
          if (val > 23) this.editHour = '23';
          this.focusNext('minute');
        }
      } else if (type === 'minute') {
        this.editMinute = this.editMinute.replace(/[^0-9]/g, '');
        if (this.editMinute.length === 2) {
          const val = parseInt(this.editMinute);
          if (val > 59) this.editMinute = '59';
          this.focusNext('second');
        }
      } else if (type === 'second') {
        this.editSecond = this.editSecond.replace(/[^0-9]/g, '');
        if (this.editSecond.length === 2) {
          const val = parseInt(this.editSecond);
          if (val > 59) this.editSecond = '59';
        }
      }
    },

    focusNext(field) {
      this.$nextTick(() => {
        if (field === 'hour' && this.$refs.popupHourInput) {
          this.$refs.popupHourInput.focus();
        } else if (field === 'minute' && this.$refs.popupMinuteInput) {
          this.$refs.popupMinuteInput.focus();
        } else if (field === 'second' && this.$refs.popupSecondInput) {
          this.$refs.popupSecondInput.focus();
        }
      });
    },

    focusPrev(field) {
      this.$nextTick(() => {
        if (field === 'hour' && this.$refs.popupHourInput) {
          this.$refs.popupHourInput.focus();
        } else if (field === 'minute' && this.$refs.popupMinuteInput) {
          this.$refs.popupMinuteInput.focus();
        }
      });
    },

    onTimeConfirm() {
      const hours = String(parseInt(this.editHour) || 0).padStart(2, '0');
      const minutes = String(parseInt(this.editMinute) || 0).padStart(2, '0');
      const seconds = String(parseInt(this.editSecond) || 0).padStart(2, '0');
      
      const upcomingTime = `${hours}:${minutes}:${seconds}`;
      const maturityTime = this.calculateMaturityTime(upcomingTime);
      const name = this.editName.trim();

      if (this.isAddingNew && this.pendingNewRow) {
        const newRow = {
          ...this.pendingNewRow,
          name,
          upcomingTime,
          maturityTime
        };
        this.tableData.push(newRow);
        this.memoName = newRow.name;
      } else if (this.editingId) {
        const index = this.getOriginalIndex(this.editingId);
        if (index !== -1) {
          this.$set(this.tableData, index, {
            ...this.tableData[index],
            name,
            upcomingTime,
            maturityTime
          });
          // 清除该记录的过期状态，使其重新开始倒计时
          this.notifiedIds = this.notifiedIds.filter(id => id !== this.editingId);
        }
      }

      this.isAddingNew = false;
      this.pendingNewRow = null;
      this.editingId = null;
      this.editName = '';
      this.showTimePicker = false;
    },

    onTimePickerCancel() {
      this.isAddingNew = false;
      this.pendingNewRow = null;
      this.editingId = null;
      this.showTimePicker = false;
    },

    onSearch() {
      // 搜索逻辑在 computed filteredData 中处理
    },

    clearSearch() {
      this.searchKeyword = '';
      this.$refs.searchInput && this.$refs.searchInput.focus();
    },

    scrollToRow(id) {
      this.showSearch = false;
      this.searchKeyword = '';
      this.$nextTick(() => {
        const row = document.querySelector(`tr[data-id="${id}"]`);
        if (row) {
          row.scrollIntoView({ behavior: 'smooth', block: 'center' });
          row.classList.add('highlight-row');
          setTimeout(() => row.classList.remove('highlight-row'), 2000);
        }
      });
    },

    deleteRowById(id) {
      const index = this.getOriginalIndex(id);
      if (index === -1) return;
      this.deleteRow(index);
    },

    toggleStolenPopover(id) {
      this.expandedStolenId = this.expandedStolenId === id ? null : id;
    },

    toggleMark(id) {
      const idx = this.markedIds.indexOf(id);
      if (idx > -1) {
        this.markedIds.splice(idx, 1);
      } else {
        this.markedIds.push(id);
      }
    },

    selectStolen(id, color) {
      this.$set(this.stolenMap, id, color);
      this.expandedStolenId = null;
    },

    closeStolenPicker() {
      this.expandedStolenId = null;
    },

    handleScroll() {
      this.showBackTop = window.scrollY > 300;
    },

    scrollToTop() {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    clearExpired() {
      const expiredRows = this.tableData.filter(row => this.isRowExpired(row));
      if (expiredRows.length === 0) {
        this.$toast('没有过期数据');
        return;
      }
      this.$dialog.confirm({
        title: '清除过期数据',
        message: `确定要删除 ${expiredRows.length} 条过期数据吗？`
      }).then(() => {
        const expiredIds = expiredRows.map(row => row.id);
        this.tableData = this.tableData.filter(row => !expiredIds.includes(row.id));
        this.notifiedIds = this.notifiedIds.filter(id => !expiredIds.includes(id));
        this.$toast.success('已清除过期数据');
      }).catch(() => {});
    },

    clearAll() {
      if (this.tableData.length === 0) {
        this.$toast('暂无数据');
        return;
      }
      this.$dialog.confirm({
        title: '清除全部数据',
        message: `确定要删除全部 ${this.tableData.length} 条数据吗？此操作不可恢复！`
      }).then(() => {
        this.tableData = [];
        this.notifiedIds = [];
        this.markedIds = [];
        this.$toast.success('已清除全部数据');
      }).catch(() => {});
    },

    calculateMaturityTime(timeStr) {
      if (!timeStr) return '';

      const parts = timeStr.split(':');
      if (parts.length !== 3) return '';

      const hours = parseInt(parts[0], 10) || 0;
      const minutes = parseInt(parts[1], 10) || 0;
      const seconds = parseInt(parts[2], 10) || 0;

      if (isNaN(hours) || isNaN(minutes) || isNaN(seconds)) return '';

      const totalSeconds = (hours * 3600) + (minutes * 60) + seconds;
      if (totalSeconds <= 0) return '';

      const now = new Date();
      const maturity = new Date(now.getTime() + totalSeconds * 1000);

      const h = String(maturity.getHours()).padStart(2, '0');
      const m = String(maturity.getMinutes()).padStart(2, '0');
      const s = String(maturity.getSeconds()).padStart(2, '0');

      return `${h}:${m}:${s}`;
    },

    getRemainingSeconds(row) {
      if (!row.maturityTime) return Infinity;
      const parts = row.maturityTime.split(':');
      if (parts.length !== 3) return Infinity;

      const now = new Date(this.now);
      const h = parseInt(parts[0], 10) || 0;
      const m = parseInt(parts[1], 10) || 0;
      const s = parseInt(parts[2], 10) || 0;

      const target = new Date(now);
      target.setHours(h, m, s, 0);

      return Math.floor((target.getTime() - now.getTime()) / 1000);
    },

    formatRemainingTime(totalSeconds) {
      if (totalSeconds <= 0) return '00:00:00';
      const h = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
      const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
      const s = String(totalSeconds % 60).padStart(2, '0');
      return `${h}:${m}:${s}`;
    },

    startMaturityCheck() {
      this.stopMaturityCheck();
      this.maturityTimer = setInterval(() => {
        this.now = Date.now();
        this.checkMaturityTimes();
      }, 1000);
    },

    stopMaturityCheck() {
      if (this.maturityTimer) {
        clearInterval(this.maturityTimer);
        this.maturityTimer = null;
      }
    },

    checkMaturityTimes() {
      for (const row of this.tableData) {
        if (!row.maturityTime) continue;
        if (this.notifiedIds.includes(row.id)) continue;
        if (this.stolenMap[row.id]) continue;

        const remaining = this.getRemainingSeconds(row);
        if (remaining <= 0) {
          this.triggerReminder(row);
          this.notifiedIds.push(row.id);
        }
      }
    },

    isRowExpired(row) {
      if (this.stolenMap[row.id]) return true;
      if (!row.maturityTime || !this.notifiedIds.includes(row.id)) return false;
      return this.getRemainingSeconds(row) <= 0;
    },

    triggerReminder(row) {
      this.reminderRowId = row.id;
      this.reminderName = row.name || '未命名用户';
      this.reminderTime = row.maturityTime;
      this.reminderRawName = row.name || '';
      this.showReminder = true;
      this.speakRemind(row.name);
    },

    speakRemind(name) {
      if (!window.speechSynthesis) return;
      window.speechSynthesis.cancel();
      const text = (name || '未命名用户') + '的作物已成熟，请立刻前往摘取';
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'zh-CN';
      utterance.rate = 1;
      utterance.volume = 1;
      const voices = window.speechSynthesis.getVoices();
      const target = voices.find(v => v.name.includes('晓晓'));
      if (target) utterance.voice = target;
      window.speechSynthesis.speak(utterance);
    },

    copyReminderName() {
      if (!this.reminderRawName) {
        this.$toast('暂无名称可复制');
        return;
      }
      this.copyName(this.reminderRawName);
    },

    selectStolenFromReminder(color) {
      if (this.reminderRowId) {
        this.$set(this.stolenMap, this.reminderRowId, color);
      }
      this.showReminder = false;
    }
  }
};
</script>

<style lang="less" scoped>
.maturity-tracking {
  min-height: 100vh;
  background-color: #f7f8fa;
  padding-bottom: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background-color: #fff;

  .page-title {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: #1f2937;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .action-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 8px;
    transition: background-color 0.2s;

    &:active {
      background-color: #f3f4f6;
      transform: scale(0.95);
    }
  }

  .action-icon {
    font-size: 20px;
  }

  .action-text {
    font-size: 10px;
    font-weight: 500;
    white-space: nowrap;
  }

  .add-icon {
    color: #1989fa;

    & + .action-text {
      color: #1989fa;
    }
  }

  .clear-expired-icon {
    color: #f59e0b;

    & + .action-text {
      color: #f59e0b;
    }
  }

  .clear-all-icon {
    color: #ef4444;

    & + .action-text {
      color: #ef4444;
    }
  }

  .search-icon {
    color: #8b5cf6;

    & + .action-text {
      color: #8b5cf6;
    }
  }

}

.table-wrapper {
  margin: 12px 16px;
  background-color: #fff;
  border-radius: 12px;
  overflow-x: auto;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

thead {
  background-color: #1a1a2e;
}

th {
  padding: 10px 12px;
  font-size: 13px;
  font-weight: 600;
  color: #fff;
  text-align: center;
  white-space: nowrap;
}

.th-index {
  width: 40px;
}

.th-name {
  text-align: left;
  padding-left: 16px;
  max-width: 0;
  overflow: hidden;
}

.td-name {
  padding: 4px 8px 4px 12px;
  max-width: 0;
  overflow: hidden;

  /deep/ .van-field {
    padding: 6px 10px;
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    border: 1.5px solid #e2e8f0;
    border-radius: 8px;
    transition: all 0.2s ease;

    .van-field__control {
      font-size: 13px;
      font-weight: 500;
      color: #1e293b;
      line-height: 1.4;
      overflow: hidden;
      text-overflow: ellipsis;

      &::placeholder {
        color: #94a3b8;
        font-weight: 400;
      }
    }

    &:hover {
      border-color: #93c5fd;
      background: #fff;
    }

    &:focus-within {
      border-color: #3b82f6;
      background: #fff;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
  }

  &.name-empty /deep/ .van-field {
    border-color: #fca5a5;
    background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);

    .van-field__control::placeholder {
      color: #f87171;
    }

    &:focus-within {
      border-color: #ef4444;
      box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
    }
  }
}

.th-time {
  text-align: center;
  width: 80px;
  white-space: nowrap;
}

.th-action {
  width: 80px;
  white-space: nowrap;
}


tbody tr {
  border-bottom: 1px solid #f0f0f0;
  transition: background-color 0.2s;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background-color: #f8f9ff;
  }

  &:active {
    background-color: #f0f2ff;
  }
}

td {
  padding: 8px 12px;
  font-size: 14px;
  color: #333;
  vertical-align: middle;
}

.td-time {
  text-align: center;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
}

.time-value {
  display: inline-block;
  background: linear-gradient(135deg, #f0fff4 0%, #dcfce7 100%);
  color: #15803d;
  font-size: 12px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
  letter-spacing: 0;
  border: 1px solid #bbf7d0;
  line-height: 1.4;
}

.time-placeholder {
  color: #c0c4cc;
  font-size: 12px;
}

.countdown-tag {
  display: inline-block;
  margin-top: 2px;
  background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%);
  color: #ea580c;
  font-size: 10px;
  font-weight: 600;
  padding: 1px 4px;
  border-radius: 3px;
  letter-spacing: 0;
  border: 1px solid #fed7aa;
  line-height: 1.4;
}

.nearest-row {
  background-color: #fffbe6 !important;

  &:hover {
    background-color: #fff7cc !important;
  }

  &:active {
    background-color: #fff3a8 !important;
  }
}

.marked-row {
  background-color: #fef3c7 !important;
  border-left: 3px solid #f59e0b !important;

  &:hover {
    background-color: #fde68a !important;
  }

  &:active {
    background-color: #fcd34d !important;
  }
}

.td-index {
  text-align: center;
  color: #909399;
  font-size: 12px;
  width: 40px;
  cursor: pointer;
}

.stolen-dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  cursor: pointer;
  transition: transform 0.15s;
  vertical-align: middle;

  &:hover {
    transform: scale(1.25);
  }

  &.gray {
    background-color: #d1d5db;
  }

  &.green {
    background-color: #22c55e;
    box-shadow: 0 0 4px rgba(34, 197, 94, 0.5);
  }

  &.orange {
    background-color: #f97316;
    box-shadow: 0 0 4px rgba(249, 115, 22, 0.5);
  }

  &.active {
    transform: scale(1.35);
    outline: 2px solid rgba(0, 0, 0, 0.15);
    outline-offset: 2px;
  }
}

.stolen-popover {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05);
  z-index: 50;
  white-space: nowrap;
  animation: popover-in 0.15s ease;
}

.stolen-popover-arrow {
  display: none;
}

@keyframes popover-in {
  from {
    opacity: 0;
    transform: translateY(-50%) scale(0.8);
  }
  to {
    opacity: 1;
    transform: translateY(-50%) scale(1);
  }
}

.mark-icon {
  color: #d1d5db;
  font-size: 18px;

  &.marked {
    color: #f59e0b;
  }
}

.expired-row {
  background-color: #f9f9f9 !important;
  opacity: 0.55;

  td {
    text-decoration: line-through;
    color: #b0b0b0 !important;
  }

  .time-value {
    background: #f3f4f6 !important;
    color: #b0b0b0 !important;
    border-color: #e5e7eb !important;
  }

  .delete-icon {
    color: #d0d0d0 !important;
  }

  &:hover {
    background-color: #f3f4f6 !important;
  }
}

.td-action {
  text-align: center;
  white-space: nowrap;
}

.action-icon {
  margin: 0 3px;
}

.delete-icon {
  color: #ef4444;
  font-size: 18px;
  cursor: pointer;
  padding: 4px;
  transition: color 0.2s;

  &:hover {
    color: #dc2626;
  }

  &:active {
    color: #b91c1c;
  }
}

.time-picker-container {
  padding-bottom: 20px;
}

.picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
}

.picker-btn {
  font-size: 15px;
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 6px;
  transition: background-color 0.2s;

  &:active {
    background-color: #f3f4f6;
  }
}

.picker-cancel {
  color: #6b7280;
}

.picker-confirm {
  color: #3b82f6;
  font-weight: 600;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);

  &:active {
    background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  }
}

.picker-title {
  font-size: 17px;
  font-weight: 600;
  color: #1f2937;
}

.picker-body {
  padding: 30px 20px 20px;
}

.name-input-section {
  margin-bottom: 24px;
}

.input-label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #6b7280;
  margin-bottom: 8px;
}

.popup-name-input {
  width: 100%;
  height: 48px;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 0 16px;
  font-size: 16px;
  font-weight: 500;
  color: #1e293b;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  outline: none;
  transition: all 0.2s ease;
  caret-color: #3b82f6;
  box-sizing: border-box;

  &::placeholder {
    color: #94a3b8;
    font-weight: 400;
  }

  &:focus {
    border-color: #3b82f6;
    background: #fff;
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1), 0 4px 12px rgba(59, 130, 246, 0.15);
  }

  &:hover:not(:focus) {
    border-color: #93c5fd;
    background: #fff;
  }
}

.time-input-section {
  margin-bottom: 16px;
}

.time-input-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.time-input-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.popup-time-input {
  width: 72px;
  height: 56px;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  text-align: center;
  font-size: 28px;
  font-weight: 700;
  color: #1e40af;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  outline: none;
  transition: all 0.2s ease;
  caret-color: #3b82f6;

  &::placeholder {
    color: #cbd5e1;
    font-weight: 400;
  }

  &:focus {
    border-color: #3b82f6;
    background: #fff;
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1), 0 4px 12px rgba(59, 130, 246, 0.15);
    transform: translateY(-2px);
  }

  &:hover:not(:focus) {
    border-color: #93c5fd;
    background: #fff;
  }
}

.time-colon {
  font-size: 32px;
  font-weight: 700;
  color: #3b82f6;
  margin-top: -20px;
}

.time-label {
  font-size: 13px;
  font-weight: 500;
  color: #6b7280;
}

.time-hint {
  text-align: center;
  margin-top: 24px;
  font-size: 13px;
  color: #9ca3af;
}

.search-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.search-bar {
  display: flex;
  align-items: center;
  width: 85%;
  max-width: 400px;
  background: #fff;
  border-radius: 24px;
  padding: 0 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.search-bar-icon {
  font-size: 20px;
  color: #8b5cf6;
  margin-right: 10px;
}

.search-bar-input {
  flex: 1;
  height: 48px;
  border: none;
  background: transparent;
  font-size: 16px;
  color: #1f2937;
  outline: none;

  &::placeholder {
    color: #9ca3b8;
  }
}

.memo-name-wrapper {
  flex: 0 0 auto;
  position: relative;
  display: flex;
  align-items: center;
}

.memo-name-input {
  width: 80px;
  height: 28px;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 0 26px 0 10px;
  font-size: 12px;
  color: #1f2937;
  background: #f8fafc;
  outline: none;
  transition: all 0.2s ease;

  &::placeholder {
    color: #9ca3af;
  }

  &:focus {
    border-color: #8b5cf6;
    background: #fff;
    box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.1);
    width: 100px;
  }
}

.memo-copy-icon {
  position: absolute;
  right: 5px;
  width: 14px;
  height: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;

  &:active {
    transform: scale(0.85);
  }
}

.copy-icon-back,
.copy-icon-front {
  position: absolute;
  border: 1.5px solid #9ca3af;
  border-radius: 2px;
  width: 9px;
  height: 11px;
}

.copy-icon-back {
  top: 0;
  left: 0;
}

.copy-icon-front {
  top: 3px;
  left: 3px;
  background: #fff;
}

.memo-copy-icon:hover .copy-icon-back,
.memo-copy-icon:hover .copy-icon-front {
  border-color: #3b82f6;
}

.search-bar-clear {
  font-size: 18px;
  color: #9ca3af;
  cursor: pointer;
  padding: 4px;

  &:active {
    color: #6b7280;
  }
}

.search-results {
  width: 85%;
  max-width: 400px;
  margin-top: 8px;
  background: #fff;
  border-radius: 12px;
  max-height: 240px;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.search-empty {
  text-align: center;
  padding: 20px;
  color: #9ca3af;
  font-size: 14px;
}

.search-result-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #f3f4f6;
  }

  &:active {
    background-color: #e5e7eb;
  }
}

.result-name {
  font-size: 14px;
  font-weight: 500;
  color: #1f2937;
}

.result-time {
  font-size: 13px;
  color: #6b7280;
  font-family: monospace;
}

.highlight-row {
  animation: highlight-glow 2.5s ease forwards;
  box-shadow: inset 0 0 0 2px #3b82f6 !important;
}

@keyframes highlight-glow {
  0%   { box-shadow: inset 0 0 0 2px #3b82f6, 0 0 8px rgba(59, 130, 246, 0.5); background-color: rgba(59, 130, 246, 0.1); }
  20%  { box-shadow: inset 0 0 0 2px #60a5fa, 0 0 14px rgba(59, 130, 246, 0.7); background-color: rgba(59, 130, 246, 0.15); }
  40%  { box-shadow: inset 0 0 0 2px #3b82f6, 0 0 8px rgba(59, 130, 246, 0.5); background-color: rgba(59, 130, 246, 0.1); }
  60%  { box-shadow: inset 0 0 0 2px #60a5fa, 0 0 14px rgba(59, 130, 246, 0.7); background-color: rgba(59, 130, 246, 0.08); }
  80%  { box-shadow: inset 0 0 0 2px #93c5fd, 0 0 6px rgba(59, 130, 246, 0.3); background-color: rgba(59, 130, 246, 0.03); }
  100% { box-shadow: none; background-color: transparent; }
}

.reminder-dialog {
  width: 280px;
  background-color: #fff;
  border-radius: 12px;
  overflow: visible;
  position: relative;
}

.reminder-title {
  padding: 20px 20px 0;
  font-size: 17px;
  font-weight: 600;
  color: #1f2937;
  text-align: center;
}

.reminder-body {
  padding: 16px 20px 20px;
  text-align: center;
}

.reminder-message {
  font-size: 15px;
  color: #333;
  text-align: center;
  line-height: 1.5;
}

.reminder-time {
  margin-top: 6px;
  font-size: 13px;
  color: #909399;
  text-align: center;
}

.reminder-copy {
  margin: 16px auto 0;
  display: inline-block;
  padding: 5px 16px;
  background-color: #f0f7ff;
  color: #1989fa;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  border: 1px solid #bedaff;
  transition: background-color 0.2s;

  &:hover {
    background-color: #e0efff;
  }

  &:active {
    background-color: #d0e5ff;
  }
}

.reminder-stolen-dot {
  position: absolute;
  top: 14px;
  left: 14px;
  display: flex;
  gap: 6px;
  z-index: 1;
}

.back-top {
  position: fixed;
  bottom: 80px;
  right: 20px;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background-color: #1989fa;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  box-shadow: 0 4px 12px rgba(25, 137, 250, 0.4);
  cursor: pointer;
  z-index: 99;
  transition: background-color 0.2s;

  &:active {
    background-color: #0570db;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s, transform 0.25s;
}

.fade-enter,
.fade-leave-to {
  opacity: 0;
  transform: scale(0.8);
}
</style>
