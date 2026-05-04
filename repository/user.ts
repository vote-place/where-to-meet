import pool from "@/config/databse/dbConnect";
import { Group } from "@/domain/group/group";
import { User } from "@/domain/user/user";
import { UserRequest } from "@/domain/user/userRequest";
import { ResultSetHeader, RowDataPacket } from "mysql2";

interface UserRow extends RowDataPacket {
    id: number
    name: string,
    group_code: string,
    password: string

}

function toUser(obj: UserRow): User {
    return {
        id: obj.id,
        name: obj.name,
        password: obj.password,
        groupCode: obj.group_code
    } as User
}



async function save(userRequest: UserRequest, group: Group) {

    const [result] = await pool.query<ResultSetHeader>("INSERT INTO `user` (group_code, name, password) VALUES (?, ?, ?)", [group.code, userRequest.name, userRequest.password]);
    return result.insertId;

}


async function findById(id: number) {
    const [[row], fields] = await pool.query<UserRow[]>("SELECT * FROM `user` WHERE id = ?", [id]);
    const result = toUser(row);
    return result;
}

async function findByGroupCode(code: string) {
    const [rows, fields] = await pool.query<UserRow[]>("SELECT * FROM `user` WHERE group_code = ?", [code]);
    const result = rows.map(toUser);
    return result;
}

async function findByNameAndGroupCode(code: string, name: string) {
    try {
        const [[row], fields] = await pool.query<UserRow[]>("SELECT * FROM `user` WHERE name = ? AND group_code = ?", [name, code]);
        const result = toUser(row);
        return result;
    }
    catch (e) {
        // console.error(e);
        return null;
    }
}

async function findByCodeAndNameAndPassword(code: string, name: string, password: string) {
    try {
        const [[row], fields] = await pool.query<UserRow[]>("SELECT * FROM `user` WHERE name = ? AND group_code = ? AND password = ?", [name, code, password]);
        const result = toUser(row);
        return result;
    }
    catch (e) {
        // console.error(e);
        return null;
    }
}

const userRepository = { save, findById, findByGroupCode, findByNameAndGroupCode, findByCodeAndNameAndPassword };

export default userRepository;