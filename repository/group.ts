import pool from "@/config/databse/dbConnect";
import { Group } from "@/domain/group/group";
import { GroupRequest } from "@/domain/group/groupRequest";
import { generateCode } from "@/util/generateCode";
import { FieldPacket, ResultSetHeader, RowDataPacket } from "mysql2";

interface GroupRow extends RowDataPacket {
    name: string,
    code: string

}

function toGroup(obj: GroupRow): Group {
    return {
        name: obj.name,
        code: obj.code
    } as Group
}



async function save(groupRequest: GroupRequest) {

    while (true) {
        const code = generateCode();

        try {
            const [result] = await pool.query<ResultSetHeader>("INSERT INTO `group` (name, code) VALUES (?, ?)", [groupRequest.name, code]);
            return code;
        } catch (err: any) {
            if (err.code === "ER_DUP_ENTRY") {
                continue;
            }
            throw err;
        }
    }

}

async function findByCode(code: string) {
    const [[row], fields] = await pool.query<GroupRow[]>("SELECT * FROM `group` WHERE code = ?", [code]);
    const result = toGroup(row);
    return result;
}

const groupRepository = { save, findByCode };

export default groupRepository;