import React, { useRef, useState } from 'react';
import { FixedSizeList as List } from 'react-window';

const VirtualOrderList = ({ orders, renderOrder, height = 400, itemSize = 150 }) => {
  const listRef = useRef(null);
  const [hoveredIndex, setHoveredIndex] = useState(null);

  if (!orders || orders.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 40, color: '#666' }}>
        No orders found
      </div>
    );
  }

  const Row = ({ index, style }) => {
    const order = orders[index];
    return (
      <div 
        style={{
          ...style,
          padding: '8px 0',
          borderBottom: '1px solid #E0E0E0'
        }}
        onMouseEnter={() => setHoveredIndex(index)}
        onMouseLeave={() => setHoveredIndex(null)}
      >
        {renderOrder(order, index, hoveredIndex === index)}
      </div>
    );
  };

  return (
    <div style={{ height: `${height}px`, overflow: 'hidden' }}>
      <List
        ref={listRef}
        height={height}
        itemCount={orders.length}
        itemSize={itemSize}
        width="100%"
        overscanCount={5}
      >
        {Row}
      </List>
    </div>
  );
};

export default VirtualOrderList;