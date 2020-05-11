import React, { useState, useEffect } from "react"
import Link from "next/link"
import PropTypes from "prop-types"
import { Alert, Button, Col, Container, Form, FormGroup, Input, Label, Row, Spinner, Table } from "reactstrap"
import ListAltIcon from "@material-ui/icons/ListAlt"
import ArrowDropDownIcon from "@material-ui/icons/ArrowDropDown"
import { useForm } from "react-hook-form"
import Select from "react-select"
import AsyncSelect from "react-select/async"

import { SearchButton } from "../../components/form/SearchButton"
import { buildAuthHeaders, redirectIfUnauthorized, withAuthentication } from "../../utils/auth"
import { Title1 } from "../../components/StyledComponents"
import Pagination from "../../components/Pagination"
import Layout from "../../components/Layout"
import { VerticalList } from "../../components/VerticalList"
import { isoToFr } from "../../utils/date"
import { ACT_CONSULTATION } from "../../utils/roles"
import { logError } from "../../utils/logger"
import { usePaginatedData } from "../../utils/hooks"
import { searchActs, fetchExport } from "../../clients/acts"
import { isOpenFeature } from "../../config"
import { mapArrayForSelect } from "../../utils/select"
import { getReferenceData } from "../../utils/init"
import { profiles as profilesConstants } from "../../utils/actsConstants"
import { memoizedSearchAskers } from "../../clients/askers"

const ActsListPage = ({ paginatedData: initialPaginatedData, currentUser }) => {
  const [paginatedData, error, loading, fetchPage] = usePaginatedData(searchActs, initialPaginatedData)
  const [isOpenedFilters, setOpenedFilters] = useState(false)
  const { register, handleSubmit, setValue, getValues } = useForm({})
  const [hospitals, setHospitals] = useState([])
  const [profiles, setProfiles] = useState([])
  const [asker, setAsker] = useState({})

  const existingHospitals = mapArrayForSelect(
    getReferenceData("hospitals"),
    (elt) => elt.id,
    (elt) => elt.name
  )

  const existingProfiles = mapArrayForSelect(
    Object.keys(profilesConstants) || [],
    (elt) => elt,
    (elt) => elt
  )

  useEffect(() => {
    // Extra field in form to store the value of selects
    register({ name: "hospitals" })
    register({ name: "profiles" })
    register({ name: "asker" })
  }, [register])

  const toggleFilters = () => {
    setOpenedFilters((state) => !state)
  }

  const onHospitalsChange = (selectedOption) => {
    // Needs transformation between format of react-select to expected format for API call
    setValue("hospitals", !selectedOption?.length ? null : selectedOption)
    // Needs to sync specifically the value to the react-select as well
    setHospitals(selectedOption)
  }

  const onProfilesChange = (selectedOption) => {
    // Needs transformation between format of react-select to expected format for API call
    setValue("profiles", !selectedOption?.length ? null : selectedOption)

    // Needs to sync specifically the value to the react-select as well
    setProfiles(selectedOption)
  }

  const onAskerChange = (selectedOption) => {
    // Needs transformation between format of react-select to expected format for API call
    setValue("asker", selectedOption)

    // Needs to sync specifically the value to the react-select as well
    setAsker(selectedOption)
  }

  const loadAskers = async (search) => {
    const askers = await memoizedSearchAskers({ search })

    return mapArrayForSelect(
      askers?.elements,
      (elt) => elt.id,
      (elt) => elt.name + (elt.depCode ? ` (${elt.depCode})` : "")
    )
  }

  const onSubmit = (formData) => {
    fetchPage(formData)(0)
  }

  const onExport = async () => {
    await fetchExport(getValues())
  }

  return (
    <Layout page="acts" currentUser={currentUser}>
      <Title1 className="mt-5 mb-4">{"Tous les actes"}</Title1>
      <Container style={{ maxWidth: 980 }}>
        <Form onSubmit={handleSubmit(onSubmit)}>
          <FormGroup inline className="mb-4 justify-content-center">
            <Row>
              <Col className="flex-grow-1">
                <Input
                  type="text"
                  name="search"
                  id="search"
                  placeholder="Rechercher un dossier par numéro, type de profil examiné, ..."
                  autoComplete="off"
                  innerRef={register}
                />
              </Col>
            </Row>
            {isOpenFeature("export") && (
              <>
                <Row className="mt-3">
                  <Col>
                    <Button color="secondary" outline={!isOpenedFilters} onClick={toggleFilters}>
                      Filtrer <ArrowDropDownIcon />
                    </Button>
                  </Col>
                </Row>{" "}
                {isOpenFeature("export") && isOpenedFilters && (
                  <div className="p-3 mt-3 border rounded shadow-xl border-light bg-light">
                    <Row>
                      <Col sm="3">
                        <Label htmlFor="startDate" className="text-dark">
                          Date de début
                        </Label>
                        <Input
                          type="date"
                          name="startDate"
                          id="startDate"
                          placeholder="Date de début"
                          innerRef={register}
                        />
                      </Col>
                      <Col sm="3">
                        <Label htmlFor="startDate" className="text-dark">
                          Date de fin
                        </Label>
                        <Input type="date" name="endDate" id="endDate" placeholder="Date de fin" innerRef={register} />
                      </Col>
                    </Row>
                    <Row className="mt-3">
                      <Col>
                        <Label className="text-dark">Établissements</Label>
                        <Select
                          options={existingHospitals}
                          value={hospitals}
                          isMulti
                          onChange={onHospitalsChange}
                          noOptionsMessage={() => "Aucun résultat"}
                          placeholder="Choisissez un établissement"
                          isClearable={true}
                          isSearchable={true}
                        />
                      </Col>
                    </Row>
                    <Row className="mt-3">
                      <Col>
                        <Label className="text-dark">Profils et actes hors examens</Label>
                        <Select
                          options={existingProfiles}
                          value={profiles}
                          isMulti
                          onChange={onProfilesChange}
                          noOptionsMessage={() => "Aucun résultat"}
                          placeholder="Choisissez un profil/acte"
                          isClearable={true}
                          isSearchable={true}
                        />
                      </Col>
                    </Row>
                    <Row className="mt-3">
                      <Col>
                        <Label className="text-dark">Demandeurs</Label>
                        <AsyncSelect
                          loadOptions={(search) => loadAskers(search)}
                          placeholder="Tapez le nom du demandeur"
                          noOptionsMessage={() => "Aucun résultat"}
                          loadingMessage={() => "Chargement..."}
                          onChange={onAskerChange}
                          isClearable={true}
                          isSearchable={true}
                          value={asker}
                        />
                      </Col>
                    </Row>
                    <Row className="mt-3">
                      <Col className="flex-grow-0">
                        <SearchButton className="btn-primary" disabled={loading} onClick={handleSubmit(onSubmit)}>
                          {loading ? <Spinner size="sm" color="light" data-testid="loading" /> : "Chercher"}
                        </SearchButton>
                      </Col>
                    </Row>
                  </div>
                )}
              </>
            )}
          </FormGroup>
        </Form>
        {error && (
          <Alert color="danger" className="mb-4">
            {error}
          </Alert>
        )}
        {!error && !paginatedData.elements.length && <div className="text-center">{"Aucun acte trouvé."}</div>}

        {!error && !!paginatedData.elements.length && (
          <>
            <div className="my-4 d-flex justify-content-center">
              <b>{paginatedData.totalCount}</b>&nbsp;résultat{paginatedData.totalCount > 1 && "s"}
            </div>
            <Table responsive className="table-hover">
              <thead>
                <tr className="table-light">
                  <th>N° dossier interne</th>
                  <th>N° PV</th>
                  <th>Date</th>
                  <th>Type de profil</th>
                  <th>{"Type d'acte"}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.elements.map((act) => (
                  <Link key={act.id} href="/acts/[id]" as={`/acts/${act.id}`}>
                    <tr key={act.id}>
                      <td>
                        <b>{act.internalNumber}</b>
                      </td>
                      <td>{act.pvNumber}</td>
                      <td>{act.examinationDate && isoToFr(act.examinationDate)}</td>
                      <td>{act.profile}</td>
                      <td>{act.examinationTypes && <VerticalList content={act.examinationTypes} />}</td>
                      <td className="text-decoration">
                        <Link href="/acts/[id]" as={`/acts/${act.id}`}>
                          <a className="text-decoration-none">Voir</a>
                        </Link>
                      </td>
                    </tr>
                  </Link>
                ))}
              </tbody>
            </Table>
            <Pagination data={paginatedData} fn={fetchPage(getValues("search"))} />
            {isOpenFeature("export") && (
              <div className="mt-5 d-flex justify-content-center">
                <SearchButton className="btn-outline-primary" disabled={loading} onClick={onExport}>
                  <ListAltIcon /> Exporter les données
                </SearchButton>
              </div>
            )}
          </>
        )}
      </Container>
    </Layout>
  )
}

ActsListPage.getInitialProps = async (ctx) => {
  const headers = buildAuthHeaders(ctx)
  try {
    const paginatedData = await searchActs({ headers })
    return { paginatedData }
  } catch (error) {
    logError("APP error", error)

    redirectIfUnauthorized(error, ctx)
  }
  return {}
}

ActsListPage.propTypes = {
  paginatedData: PropTypes.object.isRequired,
  currentUser: PropTypes.object.isRequired,
}

export default withAuthentication(ActsListPage, ACT_CONSULTATION)
