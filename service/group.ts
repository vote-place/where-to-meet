import { GroupRequest } from "@/domain/participant/groupRequest";
import groupRepository from "@/repository/group";


async function save(groupRequest: GroupRequest) {
    const result = await groupRepository.save(groupRequest);
    const group = await groupRepository.findByCode(result)
    return group
}

async function findByCode(code: string) {
    const result = await groupRepository.findByCode(code)
    return result
}

const groupService = { save, findByCode }
export default groupService