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




const userService = { save, findById, findByGroup }

export default userService;