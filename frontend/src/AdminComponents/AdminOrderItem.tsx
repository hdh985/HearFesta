import React from 'react';
import axios from 'axios';

interface OrderItem {
  name: string;
  served_by?: string;
}

interface Order {
  id: number;
  table: string;
  name: string;
  items: OrderItem[] | string; // ✅ 문자열일 수도 있음
  total: number;
  song: string;
  image_path: string;
  timestamp: string;
  processed: boolean;
  table_size: number;
}

interface Props {
  order: Order;
  elapsed: number;
  adminName: string;
  onRefresh: () => void;
}

export default function AdminOrderItem({
  order,
  elapsed,
  adminName,
  onRefresh,
}: Props) {
  const getZone = (table: number) => {
    if (table >= 1 && table <= 50) return '돌다방';
    if (table >= 51 && table <= 100) return '흡연부스';
    return '기타';
  };

  const handleItemToggle = async (itemIndex: number, currentServedBy?: string) => {
    try {
      const formData = new FormData();
      formData.append('item_index', itemIndex.toString());
      formData.append('admin', currentServedBy ? '' : adminName);
      await axios.patch(
        `${process.env.REACT_APP_API_BASE_URL}/api/orders/${order.id}/serve-item`,
        formData
      );
      onRefresh();
    } catch (e) {
      console.error('항목 처리 실패', e);
    }
  };

  const handleComplete = async () => {
    try {
      await axios.patch(
        `${process.env.REACT_APP_API_BASE_URL}/api/orders/${order.id}/complete`
      );
      onRefresh();
    } catch (e) {
      console.error('전체 처리 실패', e);
    }
  };

  const handleToggleStatus = async () => {
    try {
      await axios.patch(
        `${process.env.REACT_APP_API_BASE_URL}/api/orders/${order.id}/toggle`
      );
      onRefresh();
    } catch (e) {
      console.error('상태 전환 실패', e);
    }
  };

  const renderTimer = (elapsed: number) => {
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}`;
    let color = 'text-green-600';
    if (elapsed >= 900) color = 'text-red-600 font-bold';
    else if (elapsed >= 600) color = 'text-yellow-500 font-semibold';
    return (
      <span
        className={`text-sm px-3 py-1 rounded-full border ${color} bg-gray-100`}
      >
        ⏱ {timeStr}
      </span>
    );
  };

  // ✅ 문자열일 경우 JSON.parse() 처리
  const parsedItems: OrderItem[] = typeof order.items === 'string'
    ? JSON.parse(order.items)
    : order.items;

  const allItemsServed = parsedItems.every((item) => item.served_by);

  return (
    <div
      className={`p-6 mb-6 border rounded-xl shadow transition ${
        order.processed ? 'bg-gray-100 opacity-70' : 'bg-white hover:shadow-md'
      }`}
    >
      <div className="flex justify-between items-center mb-3">
        <h4 className="text-lg font-bold text-blue-700">
          {getZone(Number(order.table))} - 테이블 {order.table} ({order.table_size}명) - {order.name}
        </h4>
        <div className="flex gap-2 items-center">
          {!order.processed && renderTimer(elapsed)}
          <button
            onClick={handleToggleStatus}
            className="text-xs px-2 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 transition"
          >
            {order.processed ? '↩ 처리 대기로' : '✅ 처리 완료로'}
          </button>
        </div>
      </div>

      <ul className="text-sm space-y-1 mb-3">
        {parsedItems.map((item, idx) => (
          <li key={idx} className="flex justify-between items-center">
            <span>
              • {item.name}
              {item.served_by && (
                <span className="ml-2 text-xs text-green-600">({item.served_by} 처리)</span>
              )}
            </span>
            {!order.processed && (
              <button
                onClick={() => handleItemToggle(idx, item.served_by)}
                className={`text-xs px-2 py-1 rounded transition ${
                  item.served_by
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'bg-green-500 text-white hover:bg-green-600'
                }`}
              >
                {item.served_by ? '되돌리기' : '처리'}
              </button>
            )}
          </li>
        ))}
      </ul>

      <div className="text-sm mb-1">
        총 금액: <span className="font-semibold">{order.total.toLocaleString()}원</span>
      </div>
      <div className="text-xs text-gray-400">
        주문 시각: {new Date(order.timestamp).toLocaleTimeString()}
      </div>

      {order.image_path && (
        <img
        src={`${process.env.REACT_APP_API_BASE_URL}/uploads/${order.image_path.replace(/^uploads\//, '')}?v=2`}
        crossOrigin="anonymous"
        alt="증빙"
      />
      
      )}


      {!order.processed && allItemsServed && (
        <button
          onClick={handleComplete}
          className="mt-4 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold rounded-lg shadow-lg transition transform hover:scale-105"
        >
          전체 처리
        </button>
      )}
    </div>
  );
}
