import { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity, Car, DollarSign, RefreshCw, Lock, User, Users, UserPlus, LayoutDashboard, Search, KeyRound, ToggleLeft, ToggleRight, ShieldCheck, ShieldOff } from 'lucide-react';

function App() {
  const [token, setToken] = useState(localStorage.getItem('admin_token') || null);
  const [vistaActiva, setVistaActiva] = useState('dashboard');
  const urlServidor = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3000';

  // Estados del login
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [errorLogin, setErrorLogin] = useState('');

  // Estados del dashboard
  const [viajes, setViajes] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [errorDashboard, setErrorDashboard] = useState(null);
  const [filtroChofer, setFiltroChofer] = useState('');

  // Estados del formulario de registro
  const [formChofer, setFormChofer] = useState({ nombre: '', placa: '', password: '' });
  const [mensajeChofer, setMensajeChofer] = useState({ tipo: '', texto: '' });
  const [guardandoChofer, setGuardandoChofer] = useState(false);

  // 🔥 NUEVOS: Estados para la tabla de choferes
  const [choferes, setChoferes] = useState([]);
  const [cargandoChoferes, setCargandoChoferes] = useState(false);
  // Modal de reseteo de contraseña
  const [modalReset, setModalReset] = useState(null); // { id, nombre }
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [mensajeReset, setMensajeReset] = useState({ tipo: '', texto: '' });
  const [guardandoReset, setGuardandoReset] = useState(false);

  // ==========================================
  // AUTENTICACIÓN
  // ==========================================
  const iniciarSesion = async (e) => {
    e.preventDefault();
    setErrorLogin('');
    try {
      const respuesta = await axios.post(`${urlServidor}/api/admin/login`, { usuario, password });
      const nuevoToken = respuesta.data.token;
      localStorage.setItem('admin_token', nuevoToken);
      setToken(nuevoToken);
    } catch {
      setErrorLogin('Credenciales incorrectas. Intenta de nuevo.');
    }
  };

  const cerrarSesion = () => {
    localStorage.removeItem('admin_token');
    setToken(null);
    setViajes([]);
    setChoferes([]);
    setVistaActiva('dashboard');
    setFiltroChofer('');
  };

  // ==========================================
  // DASHBOARD
  // ==========================================
  const cargarReporte = async () => {
    if (!token) return;
    setCargando(true);
    setErrorDashboard(null);
    try {
      const respuesta = await axios.get(`${urlServidor}/api/admin/viajes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setViajes(respuesta.data);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) cerrarSesion();
      else setErrorDashboard('⚠️ Error conectando al servidor.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (token && vistaActiva === 'dashboard') cargarReporte();
    if (token && vistaActiva === 'conductores') cargarChoferes();
  }, [token, vistaActiva]);

  // ==========================================
  // 🔥 CHOFERES
  // ==========================================
  const cargarChoferes = async () => {
    setCargandoChoferes(true);
    try {
      const respuesta = await axios.get(`${urlServidor}/api/admin/choferes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setChoferes(respuesta.data);
    } catch (err) {
      console.error('Error cargando choferes:', err);
    } finally {
      setCargandoChoferes(false);
    }
  };

  const registrarNuevoChofer = async (e) => {
    e.preventDefault();
    setGuardandoChofer(true);
    setMensajeChofer({ tipo: '', texto: '' });
    try {
      const respuesta = await axios.post(`${urlServidor}/api/admin/choferes`, {
        nombre_completo: formChofer.nombre,
        placa_vehiculo: formChofer.placa,
        password: formChofer.password
      }, { headers: { Authorization: `Bearer ${token}` } });

      setMensajeChofer({ tipo: 'exito', texto: respuesta.data.mensaje });
      setFormChofer({ nombre: '', placa: '', password: '' });
      cargarChoferes(); // Recargamos la tabla
      setTimeout(() => setMensajeChofer({ tipo: '', texto: '' }), 4000);
    } catch (err) {
      setMensajeChofer({ tipo: 'error', texto: err.response?.data?.error || 'Ocurrió un error al registrar el chofer.' });
    } finally {
      setGuardandoChofer(false);
    }
  };

  const toggleEstadoChofer = async (chofer) => {
    try {
      await axios.patch(
        `${urlServidor}/api/admin/choferes/${chofer.id}/estado`,
        { estado_activo: !chofer.estado_activo },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      cargarChoferes();
    } catch (err) {
      console.error('Error cambiando estado:', err);
    }
  };

  const abrirModalReset = (chofer) => {
    setModalReset({ id: chofer.id, nombre: chofer.nombre_completo });
    setNuevaPassword('');
    setMensajeReset({ tipo: '', texto: '' });
  };

  const cerrarModalReset = () => {
    setModalReset(null);
    setNuevaPassword('');
    setMensajeReset({ tipo: '', texto: '' });
  };

  const resetearPassword = async (e) => {
    e.preventDefault();
    setGuardandoReset(true);
    setMensajeReset({ tipo: '', texto: '' });
    try {
      const respuesta = await axios.patch(
        `${urlServidor}/api/admin/choferes/${modalReset.id}/password`,
        { nueva_password: nuevaPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMensajeReset({ tipo: 'exito', texto: respuesta.data.mensaje });
      setTimeout(() => cerrarModalReset(), 2000);
    } catch (err) {
      setMensajeReset({ tipo: 'error', texto: err.response?.data?.error || 'Error al actualizar la contraseña.' });
    } finally {
      setGuardandoReset(false);
    }
  };

  // ==========================================
  // FILTRADO Y TOTALES
  // ==========================================
  const viajesFiltrados = viajes.filter(v =>
    v.chofer.toLowerCase().includes(filtroChofer.toLowerCase()) ||
    v.placa_vehiculo.toLowerCase().includes(filtroChofer.toLowerCase())
  );
  const totalRecaudado = viajesFiltrados.reduce((acc, viaje) => acc + parseFloat(viaje.tarifa_total), 0);

  // ==========================================
  // PANTALLA: LOGIN
  // ==========================================
  if (!token) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4 font-sans">
        <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md border-t-8 border-blue-800">
          <div className="text-center mb-8">
            <Car className="w-16 h-16 text-blue-800 mx-auto mb-2" />
            <h1 className="text-2xl font-black text-gray-800 tracking-wider">PULPOS <span className="font-light text-blue-600">ADMIN</span></h1>
            <p className="text-gray-500 text-sm mt-1">Portal Exclusivo de Gerencia</p>
          </div>
          <form onSubmit={iniciarSesion} className="space-y-6">
            {errorLogin && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-semibold text-center border border-red-200">{errorLogin}</div>}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Usuario</label>
              <div className="relative">
                <User className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
                <input type="text" className="w-full bg-gray-50 pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-800 outline-none" placeholder="admin" value={usuario} onChange={(e) => setUsuario(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Contraseña</label>
              <div className="relative">
                <Lock className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
                <input type="password" className="w-full bg-gray-50 pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-800 outline-none" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
            </div>
            <button type="submit" className="w-full bg-blue-800 text-white font-bold py-3 rounded-lg hover:bg-blue-900 transition shadow-lg">INGRESAR AL SISTEMA</button>
          </form>
        </div>
      </div>
    );
  }

  // ==========================================
  // PANTALLA PRINCIPAL
  // ==========================================
  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-800 flex flex-col">

      {/* MODAL RESETEAR CONTRASEÑA */}
      {modalReset && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center space-x-3 mb-5">
              <div className="bg-yellow-100 p-2 rounded-lg">
                <KeyRound className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800 text-lg">Resetear Contraseña</h3>
                <p className="text-sm text-gray-500">{modalReset.nombre}</p>
              </div>
            </div>

            {mensajeReset.texto && (
              <div className={`mb-4 p-3 rounded-lg text-sm font-semibold ${mensajeReset.tipo === 'exito' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                {mensajeReset.texto}
              </div>
            )}

            <form onSubmit={resetearPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Nueva Contraseña</label>
                <input
                  type="password"
                  required
                  minLength={4}
                  className="w-full bg-gray-50 px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-yellow-400 outline-none"
                  placeholder="Mínimo 4 caracteres"
                  value={nuevaPassword}
                  onChange={(e) => setNuevaPassword(e.target.value)}
                />
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button type="button" onClick={cerrarModalReset} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 font-semibold transition">
                  Cancelar
                </button>
                <button type="submit" disabled={guardandoReset} className="px-4 py-2 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-white font-bold transition disabled:opacity-60 flex items-center space-x-2">
                  {guardandoReset ? <RefreshCw className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                  <span>{guardandoReset ? 'Guardando...' : 'Actualizar'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NAVBAR */}
      <nav className="bg-blue-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Car className="w-8 h-8 text-green-400" />
            <h1 className="text-2xl font-bold tracking-wider">PULPOS <span className="font-light text-blue-300">ADMIN</span></h1>
          </div>
          <div className="flex items-center space-x-6">
            <div className="hidden md:flex space-x-2 bg-blue-800 p-1 rounded-lg">
              <button onClick={() => setVistaActiva('dashboard')} className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-bold transition ${vistaActiva === 'dashboard' ? 'bg-white text-blue-900 shadow' : 'text-blue-100 hover:text-white'}`}>
                <LayoutDashboard className="w-4 h-4" /><span>Tablero</span>
              </button>
              <button onClick={() => setVistaActiva('conductores')} className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-bold transition ${vistaActiva === 'conductores' ? 'bg-white text-blue-900 shadow' : 'text-blue-100 hover:text-white'}`}>
                <Users className="w-4 h-4" /><span>Conductores</span>
              </button>
            </div>
            <div className="flex items-center space-x-4 border-l border-blue-700 pl-4">
              <span className="text-sm font-semibold text-blue-200">Gerencia</span>
              <button onClick={cerrarSesion} className="text-white hover:text-red-400 text-sm font-bold underline transition">Salir</button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8 flex-1 w-full">

        {/* VISTA: TABLERO */}
        {vistaActiva === 'dashboard' && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-gray-500 text-sm font-bold mb-1">RECAUDACIÓN FILTRADA</h3>
                    <p className="text-3xl font-black text-gray-800">Bs {totalRecaudado.toFixed(2)}</p>
                  </div>
                  <DollarSign className="text-blue-500 opacity-50 w-8 h-8" />
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-gray-500 text-sm font-bold mb-1">VIAJES EN PANTALLA</h3>
                    <p className="text-3xl font-black text-gray-800">{viajesFiltrados.length}</p>
                  </div>
                  <Activity className="text-green-500 opacity-50 w-8 h-8" />
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-purple-500 flex flex-col justify-center">
                <h3 className="text-gray-500 text-sm font-bold mb-1">ALGORITMO TOPOGRÁFICO</h3>
                <p className="text-lg font-bold text-green-600 flex items-center gap-2">
                  <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>SISTEMA EN LÍNEA
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex flex-col md:flex-row md:justify-between md:items-center bg-gray-50 gap-4">
                <h2 className="text-lg font-bold text-gray-700">Flujo de Viajes</h2>
                <div className="relative w-full md:w-72">
                  <Search className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
                  <input type="text" placeholder="Buscar chofer o placa..." className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 outline-none focus:ring-2 focus:ring-blue-500 text-sm transition" value={filtroChofer} onChange={(e) => setFiltroChofer(e.target.value)} />
                </div>
                <button onClick={cargarReporte} disabled={cargando} className="flex items-center justify-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-200 transition font-bold text-sm disabled:opacity-50 whitespace-nowrap">
                  <RefreshCw className={`w-4 h-4 ${cargando ? 'animate-spin' : ''}`} />
                  {cargando ? 'Actualizando...' : 'Sincronizar'}
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-100 text-gray-600 text-sm uppercase tracking-wider">
                      <th className="px-6 py-4 font-semibold">Conductor / Unidad</th>
                      <th className="px-6 py-4 font-semibold">Distancia</th>
                      <th className="px-6 py-4 font-semibold">Tiempo Espera</th>
                      <th className="px-6 py-4 font-semibold text-right">Tarifa Calculada</th>
                      <th className="px-6 py-4 font-semibold">Registro</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {errorDashboard && <tr><td colSpan="5" className="text-center py-8 text-red-500 font-bold">{errorDashboard}</td></tr>}
                    {!errorDashboard && viajesFiltrados.length === 0 && !cargando && <tr><td colSpan="5" className="text-center py-8 text-gray-500">No se encontraron viajes para esta búsqueda.</td></tr>}
                    {viajesFiltrados.map((viaje) => (
                      <tr key={viaje.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4">
                          <div className="font-bold text-gray-800">{viaje.chofer}</div>
                          <div className="text-xs text-gray-500">{viaje.placa_vehiculo}</div>
                        </td>
                        <td className="px-6 py-4 font-medium text-blue-600">{parseFloat(viaje.distancia_km).toFixed(2)} km</td>
                        <td className="px-6 py-4 text-orange-500 font-medium">{Math.floor(viaje.tiempo_detencion_min)} min</td>
                        <td className="px-6 py-4 text-right font-black text-green-700 text-lg">Bs {parseFloat(viaje.tarifa_total).toFixed(2)}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{new Date(viaje.fecha_hora).toLocaleString('es-BO')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* VISTA: CONDUCTORES */}
        {vistaActiva === 'conductores' && (
          <div className="space-y-8">

            {/* FORMULARIO REGISTRO */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200 max-w-2xl mx-auto">
              <div className="px-6 py-5 border-b border-gray-200 bg-gray-50 flex items-center space-x-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <UserPlus className="w-6 h-6 text-blue-700" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-800">Registrar Nuevo Conductor</h2>
                  <p className="text-sm text-gray-500">Añade credenciales de acceso para la aplicación móvil.</p>
                </div>
              </div>
              <div className="p-6">
                {mensajeChofer.texto && (
                  <div className={`mb-6 p-4 rounded-lg ${mensajeChofer.tipo === 'exito' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                    <div className="font-bold text-sm">{mensajeChofer.texto}</div>
                  </div>
                )}
                <form onSubmit={registrarNuevoChofer} className="space-y-5">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Nombre Completo</label>
                    <input type="text" required className="w-full bg-gray-50 px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none transition" placeholder="Ej. Juan Pérez" value={formChofer.nombre} onChange={(e) => setFormChofer({...formChofer, nombre: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Placa Vehicular</label>
                      <input type="text" required className="w-full bg-gray-50 px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none transition uppercase" placeholder="1234-XYZ" value={formChofer.placa} onChange={(e) => setFormChofer({...formChofer, placa: e.target.value.toUpperCase()})} />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Contraseña de Acceso</label>
                      <input type="password" required className="w-full bg-gray-50 px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none transition" placeholder="••••••••" value={formChofer.password} onChange={(e) => setFormChofer({...formChofer, password: e.target.value})} />
                    </div>
                  </div>
                  <div className="pt-4 mt-6 border-t border-gray-100 flex justify-end">
                    <button type="submit" disabled={guardandoChofer} className="bg-blue-700 text-white font-bold px-6 py-2 rounded-lg hover:bg-blue-800 transition shadow-md disabled:opacity-70 flex items-center space-x-2">
                      {guardandoChofer ? <><RefreshCw className="w-4 h-4 animate-spin" /><span>Guardando...</span></> : <span>Crear Credencial</span>}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* 🔥 TABLA DE CONDUCTORES REGISTRADOS */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
              <div className="px-6 py-5 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <div className="bg-purple-100 p-2 rounded-lg">
                    <Users className="w-6 h-6 text-purple-700" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-800">Conductores Registrados</h2>
                    <p className="text-sm text-gray-500">{choferes.length} conductor{choferes.length !== 1 ? 'es' : ''} en el sistema</p>
                  </div>
                </div>
                <button onClick={cargarChoferes} disabled={cargandoChoferes} className="flex items-center gap-2 bg-purple-100 text-purple-700 px-3 py-2 rounded-lg hover:bg-purple-200 transition font-bold text-sm disabled:opacity-50">
                  <RefreshCw className={`w-4 h-4 ${cargandoChoferes ? 'animate-spin' : ''}`} />
                  Actualizar
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-100 text-gray-600 text-sm uppercase tracking-wider">
                      <th className="px-6 py-4 font-semibold">ID</th>
                      <th className="px-6 py-4 font-semibold">Nombre Completo</th>
                      <th className="px-6 py-4 font-semibold">Placa</th>
                      <th className="px-6 py-4 font-semibold">Contraseña</th>
                      <th className="px-6 py-4 font-semibold text-center">Estado</th>
                      <th className="px-6 py-4 font-semibold text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {cargandoChoferes && (
                      <tr><td colSpan="6" className="text-center py-8 text-gray-400">Cargando conductores...</td></tr>
                    )}
                    {!cargandoChoferes && choferes.length === 0 && (
                      <tr><td colSpan="6" className="text-center py-8 text-gray-400">No hay conductores registrados aún.</td></tr>
                    )}
                    {choferes.map((chofer) => (
                      <tr key={chofer.id} className={`hover:bg-gray-50 transition ${!chofer.estado_activo ? 'opacity-50' : ''}`}>
                        <td className="px-6 py-4 text-gray-400 text-sm font-mono">#{chofer.id}</td>
                        <td className="px-6 py-4 font-bold text-gray-800">{chofer.nombre_completo}</td>
                        <td className="px-6 py-4">
                          <span className="bg-blue-100 text-blue-800 font-mono font-bold px-3 py-1 rounded-full text-sm">{chofer.placa_vehiculo}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-gray-400 font-mono tracking-widest text-lg">••••••••</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {chofer.estado_activo ? (
                            <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full">
                              <ShieldCheck className="w-3 h-3" /> ACTIVO
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-red-100 text-red-600 text-xs font-bold px-3 py-1 rounded-full">
                              <ShieldOff className="w-3 h-3" /> INACTIVO
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            {/* Botón resetear contraseña */}
                            <button
                              onClick={() => abrirModalReset(chofer)}
                              title="Resetear contraseña"
                              className="p-2 rounded-lg bg-yellow-100 text-yellow-700 hover:bg-yellow-200 transition"
                            >
                              <KeyRound className="w-4 h-4" />
                            </button>
                            {/* Botón activar/desactivar */}
                            <button
                              onClick={() => toggleEstadoChofer(chofer)}
                              title={chofer.estado_activo ? 'Desactivar conductor' : 'Activar conductor'}
                              className={`p-2 rounded-lg transition ${chofer.estado_activo ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
                            >
                              {chofer.estado_activo ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}

export default App;