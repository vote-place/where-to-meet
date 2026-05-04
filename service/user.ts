import { Group } from "@/domain/group/group";
import { UserRequest } from "@/domain/user/userRequest";
import userRepository from "@/repository/user";

async function save(userRequest: UserRequest, group: Group) {
    const id = await userRepository.save(userRequest, group);
    const result = await userService.findById(id);
    return result
}


function findById(id: number) {
    return userRepository.findById(id);

}

function findByGroup(group: Group) {
    return userRepository.findByGroupCode(group.code);
}

async function isExist(code: string, name: string): Promise<boolean> {
    const result = await userRepository.findByNameAndGroupCode(name, code)
    console.log(result)
    return Boolean(result)
}

async function findByCodeAndNameAndPassword(code: string, name: string, password: string) {
    const result = await userRepository.findByCodeAndNameAndPassword(code, name, password)
    return result
}



const userService = { save, findById, findByGroup, isExist, findByCodeAndNameAndPassword }

export default userService;