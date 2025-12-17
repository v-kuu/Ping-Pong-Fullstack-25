import PrivacyPolicy from "../components/PrivacyPolicy.tsx";
import ToS from "../components/ToS.tsx";

export default function Footer(props: { active: string }) {
    const isPP = props.active == "/privacy-policy";
    const isToS = props.active == "/terms-of-service";
    const items = [
        {
            name: "Terms of Service",
            href: "/terms-of-service",
        },
        {
            name: "Privacy Policy",
            href: "/privacy-policy",
        },
    ];
    return (
        <footer class="footer sm:footer-horizontal footer-center bg-base-300 text-base-content p-4">
            <aside>
               <p>Copyright © {new Date().getFullYear()} - All right reserved by Pong Company</p>
               <ul>
                  {items.map((item) => (
               <li
                  key={item.href}
                  aria-current={props.active === item.href ? "page" : undefined}
               >
                 <a
                     href={item.href}
                     class ={`p-1 sm:p-2 ${
                      props.active === item.her ? "font-bold" : ""
                     } aria-[current]:font-bold`}
                  >
                    {item.name}
                </a>
              </li>
             ))}
           </ul>
          </aside>
       </footer>
    )
}
