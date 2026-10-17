import { Plane } from "lucide-react";
import { Link } from "react-router-dom";

const Logo = () => {
  return (
    <Link to="/dashboard" className="flex items-center gap-2.5">
      <div className="flexs items-center justify-center rounded-md bg-accent text-white">
        <Plane className="size-40 " />
      </div>
    </Link>
  );
}

export default Logo;