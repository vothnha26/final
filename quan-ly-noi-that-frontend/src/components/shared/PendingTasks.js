import React, { useState } from 'react';
import { 
  IoCheckboxOutline,
  IoSquareOutline,
  IoTimeOutline,
  IoPersonOutline,
  IoCalendarOutline,
  IoFlagOutline,
  IoAddOutline,
  IoSearchOutline,
  IoFilterOutline
} from 'react-icons/io5';

const PendingTasks = () => {
  const [tasks, setTasks] = useState([
    {
      id: 1,
      title: 'Hoàn thành StaffManagement.js',
      description: 'Tạo giao diện quản lý nhân viên với CRUD operations',
      priority: 'high',
      assignee: 'Dev Team',
      dueDate: '2024-10-15',
      category: 'Development',
      status: 'in-progress',
      progress: 70
    },
    {
      id: 2,
      title: 'Tạo RoleManagement.js',
      description: 'Giao diện quản lý vai trò và quyền hạn người dùng',
      priority: 'medium',
      assignee: 'Dev Team',
      dueDate: '2024-10-16',
      category: 'Development',
      status: 'pending',
      progress: 0
    },
    {
      id: 3,
      title: 'Hoàn thiện CustomerVouchers.js',
      description: 'Giao diện khách hàng xem và quản lý voucher',
      priority: 'medium',
      assignee: 'Frontend Team',
      dueDate: '2024-10-17',
      category: 'Development',
      status: 'pending',
      progress: 0
    },
    {
      id: 4,
      title: 'CustomerLoyaltyProgram.js',
      description: 'Giao diện chương trình khách hàng thân thiết',
      priority: 'low',
      assignee: 'UI/UX Team',
      dueDate: '2024-10-18',
      category: 'Development',
      status: 'pending',
      progress: 0
    },
    {
      id: 5,
      title: 'Testing toàn bộ hệ thống',
      description: 'Kiểm tra và test tất cả components đã tạo',
      priority: 'high',
      assignee: 'QA Team',
      dueDate: '2024-10-20',
      category: 'Testing',
      status: 'pending',
      progress: 0
    },
    {
      id: 6,
      title: 'Tối ưu hóa performance',
      description: 'Cải thiện hiệu suất và tối ưu hóa code',
      priority: 'medium',
      assignee: 'Dev Team',
      dueDate: '2024-10-22',
      category: 'Optimization',
      status: 'pending',
      progress: 0
    }
  ]);

  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50';
      case 'in-progress': return 'text-blue-600 bg-blue-50';
      case 'pending': return 'text-orange-600 bg-orange-50';
      case 'blocked': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesFilter = filter === 'all' || task.status === filter;
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const stats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    inProgress: tasks.filter(t => t.status === 'in-progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
  };

  const toggleTaskComplete = (taskId) => {
    setTasks(tasks.map(task => 
      task.id === taskId 
        ? { ...task, status: task.status === 'completed' ? 'pending' : 'completed', progress: task.status === 'completed' ? 0 : 100 }
        : task
    ));
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">📋 Công việc chưa hoàn thành</h1>
        <p className="text-gray-600">Theo dõi và quản lý các task đang thực hiện</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Tổng công việc</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <IoSquareOutline className="text-3xl text-gray-400" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-600 text-sm">Chờ thực hiện</p>
              <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
            </div>
            <IoTimeOutline className="text-3xl text-orange-400" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm">Đang thực hiện</p>
              <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
            </div>
            <IoPersonOutline className="text-3xl text-blue-400" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm">Hoàn thành</p>
              <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
            </div>
            <IoCheckboxOutline className="text-3xl text-green-400" />
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <IoSearchOutline className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm công việc..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-80"
              />
            </div>

            <div className="flex items-center gap-2">
              <IoFilterOutline className="text-gray-400" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tất cả</option>
                <option value="pending">Chờ thực hiện</option>
                <option value="in-progress">Đang thực hiện</option>
                <option value="completed">Hoàn thành</option>
              </select>
            </div>
          </div>

          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
            <IoAddOutline />
            Thêm công việc
          </button>
        </div>
      </div>

      {/* Tasks List */}
      <div className="space-y-4">
        {filteredTasks.map((task) => (
          <div key={task.id} className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4 flex-1">
                <button
                  onClick={() => toggleTaskComplete(task.id)}
                  className="mt-1"
                >
                  {task.status === 'completed' ? (
                    <IoCheckboxOutline className="text-green-600 text-xl" />
                  ) : (
                    <IoSquareOutline className="text-gray-400 text-xl hover:text-blue-600" />
                  )}
                </button>

                <div className="flex-1">
                  <h3 className={`text-lg font-semibold mb-2 ${task.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                    {task.title}
                  </h3>
                  <p className="text-gray-600 mb-3">{task.description}</p>

                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <IoFlagOutline className="text-gray-400" />
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                        {task.priority === 'high' ? 'Cao' : task.priority === 'medium' ? 'Trung bình' : 'Thấp'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <IoPersonOutline className="text-gray-400" />
                      <span className="text-gray-700">{task.assignee}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <IoCalendarOutline className="text-gray-400" />
                      <span className="text-gray-700">{task.dueDate}</span>
                    </div>

                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                      {task.status === 'pending' ? 'Chờ thực hiện' : 
                       task.status === 'in-progress' ? 'Đang thực hiện' :
                       task.status === 'completed' ? 'Hoàn thành' : 'Khác'}
                    </span>
                  </div>

                  {task.status === 'in-progress' && (
                    <div className="mt-3">
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Tiến độ</span>
                        <span>{task.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${task.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                  {task.category}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredTasks.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <IoCheckboxOutline className="mx-auto text-6xl text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Không có công việc nào</h3>
          <p className="text-gray-500">
            {searchTerm || filter !== 'all' 
              ? 'Không tìm thấy công việc phù hợp với bộ lọc'
              : 'Tất cả công việc đã hoàn thành!'}
          </p>
        </div>
      )}
    </div>
  );
};

export default PendingTasks;


