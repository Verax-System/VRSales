import React from 'react';
import { Card, Statistic, Spin } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';

const KpiCard = ({ title, value, prefix, precision = 0, loading, style }) => {
  return (
    <Card style={style}>
      {loading ? (
        <div style={{ textAlign: 'center' }}>
          <Spin />
        </div>
      ) : (
        <Statistic
          title={title}
          value={value}
          precision={precision}
          prefix={prefix}
          valueStyle={{ color: '#1890ff' }}
        />
      )}
    </Card>
  );
};

export default KpiCard;