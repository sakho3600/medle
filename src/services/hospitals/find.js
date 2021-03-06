import knex from "../../knex/knex"
import { STATUS_400_BAD_REQUEST } from "../../utils/http"
import { APIError } from "../../utils/errors"
import { transform, transformAll } from "../../models/hospitals"

export const find = async ({ id }) => {
  if (!id || isNaN(id)) {
    throw new APIError({
      status: STATUS_400_BAD_REQUEST,
      message: "Bad request",
    })
  }

  const [hospital] = await knex("hospitals").where("id", id)

  return transform(hospital)
}

export const findList = async (arr) => {
  if (!arr?.length) {
    return []
  }

  const hospitals = await knex("hospitals").whereIn("id", arr)

  return transformAll(hospitals)
}
