<template>
  <div class="recycle-bin-page">
    <div class="recycle-header">
      <van-icon name="arrow-left" class="back-btn" @click="$router.back()" />
      <span class="recycle-title">回收站</span>
      <span class="recycle-count">{{ filteredData.length }} / {{ deletedData.length }} 条</span>
    </div>

    <div v-if="deletedData.length > 0" class="recycle-filter">
      <van-icon name="calendar-o" class="filter-icon" />
      <span class="filter-label">筛选日期</span>
      <span class="filter-value" @click="showDatePicker = true">{{ filterDate || '全部' }}</span>
      <span v-if="filterDate" class="filter-clear" @click="filterDate = ''">清除</span>
      <van-popup v-model="showDatePicker" position="bottom" round>
        <van-datetime-picker
          v-model="currentDate"
          type="date"
          :min-date="minDate"
          :max-date="maxDate"
          @confirm="onDateConfirm"
          @cancel="showDatePicker = false"
        />
      </van-popup>
    </div>

    <div v-if="deletedData.length === 0" class="recycle-empty">
      <van-icon name="info-o" size="48" color="#dcdfe6" />
      <p>回收站为空</p>
    </div>

    <div v-else-if="filteredData.length === 0" class="recycle-empty">
      <p>该日期无数据</p>
    </div>

    <div v-else class="recycle-list">
      <div v-for="item in filteredData" :key="item.id" class="recycle-item">
        <div class="recycle-item-info">
          <span class="recycle-item-name">
            <span
              v-if="item.stolenStatus"
              class="rb-dot"
              :class="item.stolenStatus"
            ></span>
            {{ item.name || '未命名' }}
          </span>
          <span v-if="item.maturityTime" class="recycle-item-time">成熟时间：{{ item.maturityTime }}</span>
        </div>
        <div class="recycle-item-actions">
          <van-icon name="replay" class="rb-action rb-restore" @click="restoreItem(item)" />
          <van-icon name="delete-o" class="rb-action rb-delete" @click="permanentDelete(item)" />
        </div>
      </div>
    </div>

    <div v-if="deletedData.length > 0" class="recycle-footer">
      <span class="rb-clear-all" @click="permanentClearAll">清空回收站</span>
    </div>
  </div>
</template>

<script>
const STORAGE_KEY = 'maturity_tracking_data';

export default {
  name: 'RecycleBin',
  data() {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return {
      deletedData: [],
      filterDate: `${y}-${m}-${d}`,
      showDatePicker: false,
      currentDate: today,
      minDate: new Date(2020, 0, 1),
      maxDate: new Date()
    };
  },
  computed: {
    filteredData() {
      if (!this.filterDate) return this.deletedData;
      return this.deletedData.filter(item => {
        if (!item.deletedAt) return false;
        return item.deletedAt.slice(0, 10) === this.filterDate;
      });
    }
  },
  created() {
    this.loadData();
  },
  methods: {
    loadData() {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          const stolenMap = parsed.stolenMap || {};
          this.deletedData = (parsed.deletedData || []).map(item => {
            if (!item.stolenStatus && stolenMap[item.id]) {
              return { ...item, stolenStatus: stolenMap[item.id] };
            }
            return item;
          });
        }
      } catch (e) {
        console.error('加载数据失败:', e);
      }
    },
    saveData() {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        const data = saved ? JSON.parse(saved) : {};
        data.deletedData = this.deletedData;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch (e) {
        console.error('保存数据失败:', e);
      }
    },
    restoreItem(item) {
      const idx = this.deletedData.findIndex(d => d.id === item.id);
      if (idx === -1) return;
      this.$dialog.confirm({
        title: '恢复数据',
        message: `确定要恢复 "${item.name || '未命名'}" 吗？`
      }).then(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        const data = saved ? JSON.parse(saved) : {};
        const tableData = data.tableData || [];
        const { stolenStatus, ...row } = item;
        tableData.push(row);
        data.tableData = tableData;
        if (stolenStatus) {
          data.stolenMap = data.stolenMap || {};
          data.stolenMap[row.id] = stolenStatus;
        }
        this.deletedData.splice(idx, 1);
        data.deletedData = this.deletedData;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        this.$toast.success('已恢复');
      }).catch(() => {});
    },
    permanentDelete(item) {
      this.$dialog.confirm({
        title: '永久删除',
        message: `确定要永久删除 "${item.name || '未命名'}" 吗？`
      }).then(() => {
        const idx = this.deletedData.findIndex(d => d.id === item.id);
        if (idx !== -1) {
          this.deletedData.splice(idx, 1);
          this.saveData();
          this.$toast.success('已永久删除');
        }
      }).catch(() => {});
    },
    permanentClearAll() {
      this.$dialog.confirm({
        title: '清空回收站',
        message: `确定要永久删除全部 ${this.deletedData.length} 条数据吗？此操作不可恢复！`
      }).then(() => {
        this.deletedData = [];
        this.saveData();
        this.$toast.success('回收站已清空');
      }).catch(() => {});
    },
    onDateConfirm(val) {
      const y = val.getFullYear();
      const m = String(val.getMonth() + 1).padStart(2, '0');
      const d = String(val.getDate()).padStart(2, '0');
      this.filterDate = `${y}-${m}-${d}`;
      this.currentDate = val;
      this.showDatePicker = false;
    }
  }
};
</script>

<style lang="less" scoped>
.recycle-bin-page {
  min-height: 100vh;
  background-color: #f7f8fa;
}

.recycle-header {
  display: flex;
  align-items: center;
  padding: 16px;
  background-color: #fff;
  border-bottom: 1px solid #f0f0f0;
  position: sticky;
  top: 0;
  z-index: 10;
}

.back-btn {
  font-size: 20px;
  color: #333;
  cursor: pointer;
  margin-right: 12px;
}

.recycle-title {
  font-size: 17px;
  font-weight: 600;
  color: #333;
  flex: 1;
}

.recycle-count {
  font-size: 12px;
  color: #9ca3af;
}

.recycle-filter {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background-color: #fff;
  border-bottom: 1px solid #f0f0f0;
}

.filter-icon {
  font-size: 16px;
  color: #3b82f6;
}

.filter-label {
  font-size: 13px;
  color: #6b7280;
}

.filter-value {
  flex: 1;
  font-size: 13px;
  color: #333;
  padding: 4px 8px;
  background-color: #f3f4f6;
  border-radius: 4px;
  cursor: pointer;

  &:active {
    background-color: #e5e7eb;
  }
}

.filter-clear {
  font-size: 13px;
  color: #3b82f6;
  cursor: pointer;
  white-space: nowrap;

  &:hover {
    color: #2563eb;
  }
}

.recycle-empty {
  padding: 60px 0;
  text-align: center;
  color: #9ca3af;

  p {
    margin-top: 12px;
    font-size: 14px;
  }
}

.recycle-list {
  padding: 8px 0;
}

.recycle-item {
  display: flex;
  align-items: center;
  padding: 14px 16px;
  margin: 0 12px 8px;
  background-color: #fff;
  border-radius: 10px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

.recycle-item-info {
  flex: 1;
  min-width: 0;
}

.recycle-item-name {
  font-size: 14px;
  color: #333;
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.recycle-item-time {
  font-size: 12px;
  color: #9ca3af;
  display: block;
  margin-top: 2px;
}

.recycle-item-actions {
  display: flex;
  gap: 16px;
  flex-shrink: 0;
  margin-left: 12px;
}

.rb-action {
  font-size: 20px;
  cursor: pointer;
  transition: transform 0.15s;

  &:active {
    transform: scale(0.85);
  }

  &.rb-restore {
    color: #3b82f6;
    &:hover { color: #2563eb; }
  }

  &.rb-delete {
    color: #ef4444;
    &:hover { color: #dc2626; }
  }
}

.rb-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 4px;
  vertical-align: middle;

  &.green {
    background-color: #22c55e;
    box-shadow: 0 0 4px rgba(34, 197, 94, 0.5);
  }

  &.orange {
    background-color: #f97316;
    box-shadow: 0 0 4px rgba(249, 115, 22, 0.5);
  }
}

.recycle-footer {
  padding: 16px;
  text-align: center;
}

.rb-clear-all {
  font-size: 14px;
  color: #ef4444;
  cursor: pointer;

  &:hover {
    color: #dc2626;
  }
}
</style>
