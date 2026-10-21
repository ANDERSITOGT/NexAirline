import Logo from "@/lib/icons";
import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { startSession, hasSession } from "@/lib/auth";
import { api } from "@/services/api";

interface LoginResponse {
  access_token: string;
  token_type: "Bearer";
  usuario: unknown;
}

//#0b1a28 color principal azul oscuro
//#f97015 color anaranjado fuerte

export const Login = () => {
    const [userCredentials, setUserCredentials] = useState({
        nombreUsuario: "",
        password: ""
        })
    const navigate = useNavigate();
    const location = useLocation();
    const destination = (location.state as { from?: string } | null)?.from || "/dashboard";


    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      try {
        const data = await api.post<LoginResponse>("/login", userCredentials);
        startSession(data.access_token, data.usuario);
        setUserCredentials({
          nombreUsuario: "",
          password: ""
        });
        navigate(destination, { replace: true });
      } catch (error) {
        console.error("Error logging in", error);
        alert("las credenciales son incorrectas");
      }
    };

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const {name, value} = event.target
        setUserCredentials({...userCredentials, [name]: value})
    }
  if (hasSession()) return <Navigate replace to="/dashboard" />;

  return (
    <div
      className={`shadow-2xl flex h-[650px] phone:h-[450px] phone:top-48 justify-center items-center phone:w-[90%] w-[70%] relative left-[15%] rounded-3xl top-16 phone:left-[3%]`}
    >
      <div className="h-full relative phone:w-[39%] flex justify-center items-center rounded-tr-[10rem] rounded-tl-[4rem] rounded-bl-[4rem] rounded-br-[10rem] w-[50%] phone:p-2 bg-[#222A35]">
        <div className="flex justify-center items-center flex-col">
          <Logo />
          <span className="text-[22px] font-bold tracking-tight text-white">
            airl<span className="text-accent">Nex</span>
          </span>
        </div>
      </div>
      <form
        onSubmit={handleSubmit}
        id="login"
        className={`w-[50%] phone:w-[60%] phone:p-4 h-full phone:h-[400px] phone:rounded-t-none p-20 flex justify-center flex-col rounded-3xl top-10 `}
      >
        <div className="relative h-max flex flex-col items-center">
          <h2 className=" text-4xl text-[#222A35] phone:text-4xl text-center font-bold mb-20">
            Ingresar al Sistema
          </h2>
          <p className="mb-4 text-slate-500 text-xl text-center phone:text-sm  ">
            Ingrese sus credenciales.
          </p>
          <input
            type="text"
            name="nombreUsuario"
            placeholder="usuario"
            value={userCredentials.nombreUsuario}
            onChange={handleInputChange}
            className=" bg-slate-100 text-2xl rounded-full w-[120%] px-3 h-20 phone:w-[190px] phone:h-12 mb-3 "
          />
          <input
            type="password"
            name="password"
            placeholder="contraseña"
            value={userCredentials.password}
            onChange={handleInputChange}
            className="bg-slate-100 my-3 text-2xl rounded-full block px-3 w-[120%] h-20 phone:w-[190px] phone:h-12"
          />
          <button
            className="w-[100%] phone:w-[160px] phone:h-[40px] h-[70px] bg-[#f97015] hover:bg-[#c95b12] transition-transform duration-300 hover:scale-100 text-2xl focus:outline-none focus:ring-1 focus:ring-black mt-3 text-white font-medium rounded-3xl px-5 py-2.5 text-center me-2 mb-2 "
            type="submit"
          >
            Ingresar
          </button>
        </div>
      </form>
    </div>
  );
};

export default Login