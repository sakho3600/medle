import React, { useState, useEffect } from "react"
import { useRouter } from "next/router"
import Link from "next/link"
import PropTypes from "prop-types"
import fetch from "isomorphic-unfetch"
import {
   Button,
   Col,
   Alert,
   Container,
   Form,
   FormFeedback,
   FormGroup,
   Input,
   Label,
   Modal,
   ModalHeader,
   ModalBody,
   ModalFooter,
} from "reactstrap"
import { useForm } from "react-hook-form"
import AsyncSelect from "react-select/async"
import Select from "react-select"

import { API_URL, ADMIN_USERS_ENDPOINT, HOSPITALS_ENDPOINT } from "../../../config"
import Layout from "../../../components/LayoutAdmin"
import { Title1 } from "../../../components/StyledComponents"
import { isEmpty } from "../../../utils/misc"
import { handleAPIResponse } from "../../../utils/errors"
import { buildAuthHeaders, redirectIfUnauthorized, withAuthentication } from "../../../utils/auth"
import { METHOD_DELETE, METHOD_POST, METHOD_PUT } from "../../../utils/http"
import { ADMIN, SUPER_ADMIN, ROLES, ROLES_DESCRIPTION } from "../../../utils/roles"
import { logError } from "../../../utils/logger"

const fetchHospitals = async value => {
   const bonus = value ? `?fuzzy=${value}` : ""

   try {
      const response = await fetch(`${API_URL}${HOSPITALS_ENDPOINT}${bonus}`)
      const hospitals = await handleAPIResponse(response)
      return isEmpty(hospitals) ? [] : hospitals
   } catch (error) {
      logError(error)
   }
}
const fetchUpdate = async user => {
   const response = await fetch(`${API_URL}${ADMIN_USERS_ENDPOINT}/${user.id}`, {
      method: METHOD_PUT,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(user),
   })
   return await handleAPIResponse(response)
}
// eslint-disable-next-line no-unused-vars
const fetchCreate = async ({ id, ...user }) => {
   const response = await fetch(`${API_URL}${ADMIN_USERS_ENDPOINT}`, {
      method: user.id ? METHOD_PUT : METHOD_POST,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(user),
   })
   return await handleAPIResponse(response)
}

const MandatorySign = () => <span style={{ color: "red" }}>*</span>

const UserDetail = ({ initialUser = {}, currentUser }) => {
   const router = useRouter()
   const { id } = router.query
   const { handleSubmit, register, errors: formErrors, setValue } = useForm({
      defaultValues: {
         id: initialUser.id,
         firstName: initialUser.firstName,
         lastName: initialUser.lastName,
         email: initialUser.email,
         role: initialUser.role,
         scope: initialUser.scope,
         hospital:
            !initialUser || !initialUser.hospital
               ? null
               : {
                    id: initialUser.hospital.id,
                    name: initialUser.hospital.name,
                 },
      },
   })

   const mapForSelect = (data, fnValue, fnLabel) => {
      if (!data) return null
      return { value: fnValue(data), label: fnLabel(data) }
   }

   const mapArrayForSelect = (data, fnValue, fnLabel) => {
      if (!data || !data.length) return null
      return data.map(curr => ({ value: fnValue(curr), label: fnLabel(curr) }))
   }

   // Special case due to react-select design : needs to store specifically the value of the select
   const [role, setRole] = useState(
      mapForSelect(
         initialUser && initialUser.role,
         elt => elt,
         elt => ROLES_DESCRIPTION[elt],
      ),
   )

   const [hospital, setHospital] = useState(
      mapForSelect(
         initialUser && initialUser.hospital,
         elt => elt.id,
         elt => elt.name,
      ),
   )

   const [scope, setScope] = useState(
      mapArrayForSelect(
         initialUser && initialUser.scope,
         elt => elt.id,
         elt => elt.name,
      ),
   )

   const [error, setError] = useState("")
   const [success, setsuccess] = useState("")
   const [modal, setModal] = useState(false)

   const toggle = () => setModal(!modal)

   const disabled = currentUser.role !== SUPER_ADMIN

   const deleteUser = () => {
      toggle()

      const deleteUser = async id => {
         try {
            await fetch(`${API_URL}${ADMIN_USERS_ENDPOINT}/${id}`, { method: METHOD_DELETE })
            router.push("/administration/users")
         } catch (error) {
            logError(error)
            setError(error)
         }
      }

      deleteUser(id)
   }

   const onSubmit = async data => {
      setError("")
      setsuccess("")

      try {
         if (isEmpty(formErrors)) {
            if (data.id) {
               await fetchUpdate(data)
               setsuccess("Utilisateur modifié.")
            } else {
               const res = await fetchCreate(data)
               setValue("id", (res && res.id) || "")
               setsuccess("Utilisateur créé.")
            }
         }
      } catch (error) {
         setError("Erreur serveur.")
      }
   }

   const onRoleChange = selectedOption => {
      // Needs transformation between format of react-select to expected format for API call
      setValue("role", (selectedOption && selectedOption.value) || null)

      // Needs to sync specifically the value to the react-select as well
      setRole(selectedOption)
   }

   const onHospitalChange = selectedOption => {
      // Needs transformation between format of react-select to expected format for API call
      setValue(
         "hospital",
         selectedOption && selectedOption.value
            ? {
                 id: selectedOption.value,
                 name: selectedOption.label,
              }
            : null,
      )
      // Needs to sync specifically the value to the react-select as well
      setHospital(selectedOption)
   }

   const onScopeChange = selectedOption => {
      // Needs transformation between format of react-select to expected format for API call
      setValue(
         "scope",
         !selectedOption || !selectedOption.length
            ? null
            : selectedOption.map(curr => ({ id: curr.value, name: curr.label })),
      )
      // Needs to sync specifically the value to the react-select as well
      setScope(selectedOption)
   }

   useEffect(() => {
      // Extra field in form to store the value of the selects
      register({ name: "role" })
      register({ name: "hospital" })
      register({ name: "scope" })
   }, [register])

   return (
      <Layout currentUser={currentUser}>
         <Container style={{ maxWidth: 720 }} className="mt-5 mb-4">
            <Title1 className="mb-5">{"Utilisateur"}</Title1>

            {error && <Alert color="danger">{error}</Alert>}

            {success && <Alert color="success">{success}</Alert>}

            <Form onSubmit={handleSubmit(onSubmit)}>
               <FormGroup row>
                  <Label for="id" sm={3}>
                     Id
                  </Label>
                  <Col sm={9}>
                     <Input type="text" name="id" id="id" disabled innerRef={register} />
                  </Col>
               </FormGroup>
               <FormGroup row>
                  <Label for="firstName" sm={3}>
                     Prénom
                  </Label>
                  <Col sm={9}>
                     <Input type="text" name="firstName" id="firstName" innerRef={register} />
                  </Col>
               </FormGroup>
               <FormGroup row>
                  <Label for="lastName" sm={3}>
                     Nom&nbsp;
                     <MandatorySign />
                  </Label>
                  <Col sm={9}>
                     <Input type="text" name="lastName" id="lastName" innerRef={register} />
                  </Col>
               </FormGroup>
               <FormGroup row>
                  <Label for="email" sm={3}>
                     Courriel&nbsp;
                     <MandatorySign />
                  </Label>
                  <Col sm={9}>
                     <Input
                        type="text"
                        name="email"
                        id="email"
                        innerRef={register({
                           required: true,
                           pattern: {
                              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i,
                           },
                        })}
                        invalid={!!formErrors.email}
                     />
                     <FormFeedback>{formErrors.email && "Courriel a un format incorrect."}</FormFeedback>
                  </Col>
               </FormGroup>
               <FormGroup row>
                  <Label for="role" sm={3}>
                     Rôle&nbsp;
                     <MandatorySign />
                  </Label>
                  <Col sm={9}>
                     <Select
                        options={Object.keys(ROLES).map(role => ({ value: role, label: ROLES_DESCRIPTION[role] }))}
                        value={role}
                        onChange={onRoleChange}
                        noOptionsMessage={() => "Aucun résultat"}
                        placeholder="Choisissez un rôle"
                        isClearable={true}
                        isSearchable={true}
                     />
                  </Col>
               </FormGroup>
               <FormGroup row>
                  <Label for="hospital" sm={3}>
                     {"Établissement d'appartenance"}
                  </Label>
                  <Col sm={9}>
                     <AsyncSelect
                        loadOptions={fetchHospitals}
                        value={hospital}
                        onChange={onHospitalChange}
                        noOptionsMessage={() => "Aucun résultat"}
                        loadingMessage={() => "Chargement..."}
                        placeholder="Choisissez un établissement"
                        isClearable={true}
                        isDisabled={disabled}
                     />
                  </Col>
               </FormGroup>
               <FormGroup row>
                  <Label for="scope" sm={3}>
                     Établissements visibles
                  </Label>
                  <Col sm={9}>
                     <AsyncSelect
                        loadOptions={fetchHospitals}
                        isMulti
                        value={scope}
                        onChange={onScopeChange}
                        noOptionsMessage={() => "Aucun résultat"}
                        loadingMessage={() => "Chargement..."}
                        placeholder="Choisissez un établissement"
                        isClearable={true}
                        isDisabled={disabled}
                     />
                  </Col>
               </FormGroup>
               <div className="justify-content-center d-flex">
                  <Button className="px-4 mt-5 mr-3" color="primary">
                     {isEmpty(initialUser) ? "Ajouter" : "Modifier"}
                  </Button>
                  <Link href="/administration/users">
                     <Button className="px-4 mt-5 " outline color="primary">
                        Retour
                     </Button>
                  </Link>
               </div>

               {!isEmpty(initialUser) && (
                  <div style={{ border: "1px solid tomato" }} className="px-4 py-3 mt-5 rounded">
                     <Title1 className="mb-4">Zone dangereuse</Title1>
                     <div className="d-flex justify-content-between align-items-center">
                        Je souhaite supprimer cet utilisateur
                        <Button className="" color="danger" outline onClick={toggle}>
                           Supprimer
                        </Button>
                     </div>
                  </div>
               )}
            </Form>
            <div>
               <Modal isOpen={modal} toggle={toggle}>
                  <ModalHeader toggle={toggle}>Voulez-vous vraiment supprimer cet utilisateur?</ModalHeader>
                  <ModalBody>
                     Si vous supprimez cet utilisateur, il ne serait plus visible ni modifiable dans la liste des
                     utilisateurs. Merci de confirmer votre choix.
                  </ModalBody>
                  <ModalFooter>
                     <Button color="primary" onClick={deleteUser}>
                        Supprimer
                     </Button>{" "}
                     <Button color="secondary" onClick={toggle}>
                        Annuler
                     </Button>
                  </ModalFooter>
               </Modal>
            </div>
         </Container>
      </Layout>
   )
}

UserDetail.getInitialProps = async ctx => {
   const authHeaders = buildAuthHeaders(ctx)

   const { id } = ctx.query

   if (!id) return { initialUser: {} }

   try {
      const response = await fetch(API_URL + ADMIN_USERS_ENDPOINT + "/" + id, { headers: authHeaders })
      const user = await handleAPIResponse(response)
      return { initialUser: user }
   } catch (error) {
      logError(error)
      redirectIfUnauthorized(error, ctx)

      return { error: "Erreur serveur" }
   }
}

UserDetail.propTypes = {
   initialUser: PropTypes.object,
   currentUser: PropTypes.object.isRequired,
}

export default withAuthentication(UserDetail, ADMIN)