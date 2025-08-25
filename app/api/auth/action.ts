// Karena ini menggunakan server actions, maka harus dideklarasikan bahwa ini hanya berjalan di server saja, maka dari itu, gunakan "use server"
"use server";

// import { getUserByEmail } from "@/db/models/User";
// import { compareTextWithHash } from "@/utils/bcrypt";
import { signToken } from "@/utils/jwt";
import { redirect } from "next/navigation";
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;
// Di sini kita akan membuat schema inputan login, maka dari itu, sekalian kita validasi dengan zod
import { z } from "zod";
import { Auth, User } from "@/types/auth";
// Di sini kita akan menyimpan data token pada cookies, maka dari itu, kita akan menggunakan cookies dari next/headers
// !! cookies tidak bisa di-import secara otomatis, jadi harus diketik manual yah
import { cookies } from "next/headers";

// Pada action ini kita akan melakukan request ke server untuk login
// Karena kita di sini belum memiliki backend yang bisa di-call, kita akan membuat logicnya di sini (asumsikan di sini se-akan-akan kita sedang berada di server)

// export const logout = async () => {
//   const cookieStore = cookies();
//   cookieStore.delete("token");

//   return redirect("/login");
// };

export const doLogin = async (loginData: Auth) => {
  const loginSchema = z.object({
    email: z.string().email({
      message: "must be email format",
    }),
    password: z
      .string({
        message: "password cannot be empty",
      })
      .nullable(),
    pin: z
      .string({
        message: "pin cannot be empty",
      })
      .nullable(),
  });

  // Memvalidasi data input dengan zod
  const parsedData = loginSchema.safeParse({
    email: loginData.email,
    password: loginData.password,
    pin: loginData.pin,
  });

  if (!parsedData.success) {
    // !! Ingat, jangan di-throw kecuali ingin menghandle error di sisi client via error.tsx !
    const errPath = parsedData.error.issues[0].path[0];
    const errMessage = parsedData.error.issues[0].message;
    const errFinalMessage = `${errPath} - ${errMessage}`;

    // Mengembalikan error via redirect
    return redirect(`${BASE_URL}/login?error=${errFinalMessage}`);
  }

  const user = (await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(parsedData.data),
  }).then((res) => res.json())) as User;

  if (!user) {
    return redirect(`${BASE_URL}/login?error=Invalid%20credentials`);
  }

  // Membuat Payload dan Token
  const payload = {
    id: user.id,
    email: user.email,
    pin: user.pin,
    department: user.department,
    role: user.role,
    status: user.status,
  };

  const token = signToken(payload);

  // Menyimpan token dengan menggunakan cookies
  cookies().set("token", token, {
    // Meng-set cookie agar hanya bisa diakses melalui HTTP(S)
    httpOnly: true,
    // Meng-set cookie agar hanya bisa diakses melalui HTTPS, karena ini hanya untuk development, maka kita akan set false
    secure: false,
    // Meng-set expiration time dari cookies
    expires: new Date(Date.now() + 1000 * 60 * 60), // 1 hour
    // Meng-set cookie agar hanya bisa diakses melalui domain yang sama
    sameSite: "strict",
  });

  // Melakukan redirect ke halaman "/"

  return user;
};

export const doLogout = async () => {
  const cookieStore = cookies();
  cookieStore.delete("token");

  return redirect("/login");
};
