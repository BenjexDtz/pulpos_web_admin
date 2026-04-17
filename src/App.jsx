import { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity, Car, DollarSign, RefreshCw } from 'lucide-react';

function App() {
  const [viajes, setViajes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const cargarReporte = async () => {
    setCargando(true);
    setError(null);
    try {
      const respuesta = await axios.get('http://127.0.0.1:3000/api/admin/viajes');
      setViajes(respuesta.data);
    } catch (err) {
      setError('⚠️ Error conectando al servidor Node.js. ¿Está encendido?');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarReporte();
  }, []);

  const totalRecaudado = viajes.reduce((acc, viaje) => acc + parseFloat(viaje.tarifa_total), 0);

  return (
    <div className="min-h-screen font-sans text-gray-800">
      <nav className="bg-blue-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Car className="w-8 h-8 text-green-400" />
            <h1 className="text-2xl font-bold tracking-wider">
              PULPOS <span className="font-light text-blue-300">ADMIN</span>
            </h1>
          </div>
          <div>
            <span className="bg-blue-800 px-4 py-2 rounded-full text-sm font-semibold">
              Gerencia General
            </span>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-gray-500 text-sm font-bold mb-1">RECAUDACIÓN TOTAL</h3>
                <p className="text-3xl font-black text-gray-800">Bs {totalRecaudado.toFixed(2)}</p>
              </div>
              <DollarSign className="text-blue-500 opacity-50 w-8 h-8" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-gray-500 text-sm font-bold mb-1">VIAJES REGISTRADOS</h3>
                <p className="text-3xl font-black text-gray-800">{viajes.length}</p>
              </div>
              <Activity className="text-green-500 opacity-50 w-8 h-8" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-purple-500 flex flex-col justify-center">
            <h3 className="text-gray-500 text-sm font-bold mb-1">ALGORITMO TOPOGRÁFICO</h3>
            <p className="text-lg font-bold text-green-600 flex items-center gap-2">
              <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
              SISTEMA EN LÍNEA
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
            <h2 className="text-lg font-bold text-gray-700">Flujo de Viajes en Tiempo Real</h2>
            <button 
              onClick={cargarReporte}
              disabled={cargando}
              className="flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-200 transition font-bold text-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${cargando ? 'animate-spin' : ''}`} />
              {cargando ? 'Actualizando...' : 'Sincronizar Datos'}
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
                {error && (
                  <tr>
                    <td colSpan="5" className="text-center py-8 text-red-500 font-bold">{error}</td>
                  </tr>
                )}
                {!error && viajes.length === 0 && !cargando && (
                  <tr>
                    <td colSpan="5" className="text-center py-8 text-gray-500">No hay viajes registrados en la base de datos.</td>
                  </tr>
                )}
                {viajes.map((viaje) => (
                  <tr key={viaje.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-800">{viaje.chofer}</div>
                      <div className="text-xs text-gray-500">{viaje.placa_vehiculo}</div>
                    </td>
                    <td className="px-6 py-4 font-medium text-blue-600">
                      {parseFloat(viaje.distancia_km).toFixed(2)} km
                    </td>
                    <td className="px-6 py-4 text-orange-500 font-medium">
                      {Math.floor(viaje.tiempo_detencion_min)} min
                    </td>
                    <td className="px-6 py-4 text-right font-black text-green-700 text-lg">
                      Bs {parseFloat(viaje.tarifa_total).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(viaje.fecha_hora).toLocaleString('es-BO')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;