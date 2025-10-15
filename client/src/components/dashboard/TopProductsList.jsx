import React from 'react';
import { Card, List, Spin, Avatar, Typography, Tooltip } from 'antd';
import { ShoppingCartOutlined } from '@ant-design/icons';

const { Text } = Typography;

const TopProductsList = ({ title, data, loading, valueKey, valueFormatter }) => {
  return (
    <Card title={title}>
      {loading ? (
        <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Spin />
        </div>
      ) : (
        <List
          itemLayout="horizontal"
          dataSource={data}
          renderItem={(item, index) => (
            <List.Item>
              <List.Item.Meta
                avatar={<Avatar style={{ backgroundColor: '#1890ff' }}>{index + 1}</Avatar>}
                title={<Tooltip title={item.product_name}>{item.product_name}</Tooltip>}
                description={`ID: ${item.product_id}`}
              />
              <Text strong>{valueFormatter(item[valueKey])}</Text>
            </List.Item>
          )}
        />
      )}
    </Card>
  );
};

export default TopProductsList;