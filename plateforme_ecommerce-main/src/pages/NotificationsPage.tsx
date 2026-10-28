import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bell, 
  CheckCircle, 
  Info, 
  AlertTriangle, 
  AlertCircle, 
  Trash2,
  Search,
  Filter,
  Calendar,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import { useApp } from '../context/AppContext';

export default function NotificationsPage() {
  const { user } = useApp();
  const { 
    notifications, 
    unreadCount, 
    loading, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification, 
    deleteAllNotifications 
  } = useNotifications();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterDate, setFilterDate] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredNotifications = useMemo(() => {
    return notifications.filter(notif => {
      const matchesSearch = notif.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            notif.message.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'all' || notif.type === filterType;
      
      let matchesDate = true;
      if (filterDate) {
        const notifDate = new Date(notif.createdAt).toISOString().split('T')[0];
        matchesDate = notifDate === filterDate;
      }

      return matchesSearch && matchesType && matchesDate;
    });
  }, [notifications, searchTerm, filterType, filterDate]);

  const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage);
  const paginatedNotifications = filteredNotifications.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (!user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 px-4">
        <Bell className="w-16 h-16 text-slate-200 mb-6" />
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Veuillez vous connecter</h2>
        <p className="text-slate-500 text-center max-w-md">Connectez-vous pour voir vos notifications.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <Bell className="w-8 h-8 text-emerald-600" />
            Mes Notifications
            {unreadCount > 0 && (
              <span className="bg-rose-500 text-white text-xs font-bold px-2 py-0.5 rounded-full mt-1">
                {unreadCount} non {unreadCount > 1 ? 'lues' : 'lue'}
              </span>
            )}
          </h1>
          <p className="text-slate-500 mt-2">Gérez vos alertes et historique de compte.</p>
        </div>
        
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button 
              onClick={markAllAsRead}
              className="text-sm font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-4 py-2 rounded-xl transition-colors"
            >
              Tout marquer lu
            </button>
          )}
          {notifications.length > 0 && (
            <button 
              onClick={deleteAllNotifications}
              className="text-sm font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 px-4 py-2 rounded-xl transition-colors flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Tout supprimer
            </button>
          )}
        </div>
      </div>

      <div className="bg-white border border-slate-100 rounded-3xl p-4 sm:p-6 mb-8 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Rechercher une notification..."
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select 
                value={filterType}
                onChange={e => { setFilterType(e.target.value); setCurrentPage(1); }}
                className="bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-8 py-2.5 text-sm focus:outline-none focus:border-emerald-500 appearance-none"
              >
                <option value="all">Tous les types</option>
                <option value="info">Information</option>
                <option value="success">Succès</option>
                <option value="warning">Avertissement</option>
                <option value="error">Erreur</option>
              </select>
            </div>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="date"
                value={filterDate}
                onChange={e => { setFilterDate(e.target.value); setCurrentPage(1); }}
                className="bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <div className="w-8 h-8 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4"></div>
            Chargement...
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-16 text-center text-slate-400 flex flex-col items-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <Bell className="w-8 h-8 text-slate-300" />
            </div>
            <p className="text-lg font-medium text-slate-600 mb-1">Aucune notification trouvée</p>
            <p className="text-sm">Essayez de modifier vos filtres ou revenez plus tard.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            <AnimatePresence initial={false}>
              {paginatedNotifications.map((notif) => (
                <motion.div 
                  key={notif.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`p-4 sm:p-6 flex gap-4 transition-colors relative group ${notif.isRead ? 'bg-white hover:bg-slate-50' : 'bg-emerald-50/20'}`}
                >
                  <div className="shrink-0 mt-1">
                    {notif.type === 'success' && <CheckCircle className="w-6 h-6 text-emerald-500" />}
                    {notif.type === 'warning' && <AlertTriangle className="w-6 h-6 text-amber-500" />}
                    {notif.type === 'error' && <AlertCircle className="w-6 h-6 text-rose-500" />}
                    {notif.type === 'info' && <Info className="w-6 h-6 text-blue-500" />}
                  </div>
                  <div className="flex-1 min-w-0 pr-16">
                    <p className={`text-base mb-1 ${notif.isRead ? 'text-slate-700' : 'text-slate-900 font-bold'}`}>
                      {notif.title}
                    </p>
                    <p className="text-sm text-slate-500">{notif.message}</p>
                    <p className="text-xs text-slate-400 mt-2 font-mono">
                      {new Date(notif.createdAt).toLocaleString('fr-FR', {
                        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  </div>
                  
                  <div className="absolute top-4 right-4 sm:top-1/2 sm:-translate-y-1/2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!notif.isRead && (
                      <button 
                        onClick={() => markAsRead(notif.id)}
                        className="p-2 text-slate-400 hover:text-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors"
                        title="Marquer comme lu"
                      >
                        <CheckCircle className="w-5 h-5" />
                      </button>
                    )}
                    <button 
                      onClick={() => deleteNotification(notif.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-8">
          <p className="text-sm text-slate-500">
            Affichage de <span className="font-bold">{((currentPage - 1) * itemsPerPage) + 1}</span> à <span className="font-bold">{Math.min(currentPage * itemsPerPage, filteredNotifications.length)}</span> sur <span className="font-bold">{filteredNotifications.length}</span>
          </p>
          <div className="flex gap-2">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-slate-600"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-slate-600"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
